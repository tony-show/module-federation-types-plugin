import * as webpack from 'webpack'
import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import * as http from 'http'
import * as https from 'https'

const asyncUnlink = util.promisify(fs.unlink);
const asyncRmdir = util.promisify(fs.rmdir);

interface PluginOptions {
  name: string
  typeOut?: string
  exposes?: Record<string, string>
  remotes?: Record<string, string>
  remoteTypesDir?: string
  clearOnStart?: string
  clearOnEnd?: string
}

class ModuleFederationTypesPlugin {
  name: string;
  typeOut: string
  exposes: Record<string, string>
  remotes: Record<string, string>
  remoteTypesDir: string
  clearOnStart: string
  clearOnEnd: string

  constructor(options: PluginOptions) {
    if (!options?.name) {
      throw new Error('Please set your app name of ModuleFederationPlugin in name option');
    }
    this.name = options.name;
    this.typeOut = options.typeOut ? `${options.typeOut}/${options.name}.d.ts` : `./types/${options.name}.d.ts`;
    this.exposes = options.exposes || undefined
    this.remotes = options.remotes || undefined
    this.remoteTypesDir = options.remoteTypesDir || path.resolve(__dirname, '..', '..', 'src', 'microfrontends', 'types')
    this.clearOnStart = options.clearOnStart || undefined
    this.clearOnEnd = options.clearOnEnd || undefined
  }

  apply(compiler: webpack.Compiler) {
    const { webpack } = compiler
    const { Compilation } = webpack
    const { RawSource } = webpack.sources

    /* Generate Exposes */
    if (this.exposes) {
      compiler.hooks.thisCompilation.tap('ModuleFederationTypesPlugin', (compilation: webpack.Compilation) => {
        compilation.hooks.processAssets.tap({
          name: 'ModuleFederationTypesPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE
        }, (assets) => {
          //collect all generated declaration files
          //and remove them from the assets that will be emitted
          const declarationFiles: Object = {}
          for (const filename in assets) {
            if (~filename.indexOf('.d.ts') && this.isExpose(filename)) {
              // @ts-ignore
              declarationFiles[filename] = assets[filename]
              compilation.deleteAsset(filename)
            }
          }
          //combine them into one declaration file
          const combinedDeclaration = this.generateCombinedDeclaration(declarationFiles)

          //and insert that back into the assets
          compilation.emitAsset(this.typeOut, new RawSource(combinedDeclaration))
        })
      });
    }

    /* Get Remotes */
    if (this.remotes) {
      const remotesUrl = Object.values(this.remotes).filter((remoteUrl) => {
        const hostRgx = new RegExp(`^${this.name}@`)
        const isHostUrl = hostRgx.test(remoteUrl)
        return !isHostUrl
      })
      console.log('REMOTES -->', remotesUrl);
      const typesRemotes = []
      remotesUrl.forEach((remote: string) => {
        const typeRemote = remote.replace(/^(.+)@(https?)(.+\/)[^/].+$/, '$2$3types/$1.d.ts')
        typesRemotes.push(typeRemote)
      })
      console.log('TYPES REMOTES -->', typesRemotes);
      this.downloadDTsFiles(typesRemotes)
    }

    if (this.clearOnStart) {
      compiler.hooks.beforeRun.tapPromise('ModuleFederationTypesPlugin', async () => {
        await this.deleteFileOrDirectory(this.clearOnStart)
      });
    }

    if (this.clearOnEnd) {
      compiler.hooks.afterEmit.tapPromise('ModuleFederationTypesPlugin', async () => {
        await this.deleteFileOrDirectory(this.clearOnEnd)
      });
    }
  }

  private isExpose(filename: string) {
    const isRequired = Object.keys(this.exposes).some((path) => {
      const expose = path.replace(/.\/(.+)$/, '$1')
      const regxp = new RegExp(expose)
      const isRequired = regxp.test(filename)
      if (isRequired) {
        console.log({ EXPOSES_TYPE: '--> ' + filename })
      }
      return isRequired
    })
    return isRequired
  }

  private async deleteFileOrDirectory(filePath) {
    try {
      const stats = await fs.promises.lstat(filePath);
      if (stats.isDirectory()) {
        const files = await fs.promises.readdir(filePath);
        await Promise.all(files.map(file => this.deleteFileOrDirectory(path.join(filePath, file))));
        await asyncRmdir(filePath);
      } else {
        await asyncUnlink(filePath);
      }
      // console.log(`Successfully deleted: ${filePath}`);
    } catch (err) {
      console.error(`Error deleting ${filePath}: ${err}`);
    }
  }

  private downloadDTsFiles(urls) {
    if (!fs.existsSync(this.remoteTypesDir)) {
      fs.mkdirSync(this.remoteTypesDir, { recursive: true });
    }

    // Delete created file
    function deleteCreatedFile(file) {
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        } else {
          console.log('File deleted:', file.path);
        }
      });
    }

    urls.forEach((url) => {
      const protocol = url.startsWith('https') ? https : http;
      const fileName = path.basename(url);
      const filePath = path.join(this.remoteTypesDir, fileName);
      const file = fs.createWriteStream(filePath);

      const request = protocol.get(url, (response) => {
        if (response.statusCode === 200) {
          console.log(`Файл ${fileName} доступен`);
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`Download Completed -> ${fileName}`);
          })
        } else {
          deleteCreatedFile(file)
        }
      });

      request.on('error', (error) => {
        console.error(`Error when download ${fileName}:`, error);
        deleteCreatedFile(file)
      });
    });
  }

  private generateCombinedDeclaration(declarationFiles: Object): string {
    let declarations = '/* exposes app modules types */\n\n';
    for (const fileName in declarationFiles) {
      // @ts-ignore
      const declarationFile = declarationFiles[fileName];
      // The lines of the files now come as a Function inside declaration file.
      const data = declarationFile.source();
      const lines = data.split("\n");
      let i = lines.length;

      while (i--) {
        const line = lines[i];
        //exclude empty lines
        let excludeLine: boolean = line == "";
        //exclude export statements
        excludeLine = excludeLine || !!~line.indexOf("export =");
        //exclude import statements
        excludeLine = excludeLine || (/import ([a-z0-9A-Z_-]+) = require\(/).test(line);

        if (excludeLine) {
          lines.splice(i, 1);
        }
        else {
          if (~line.indexOf("declare ")) {
            lines[i] = line.replace("declare ", "");
          }
          //add tab
          lines[i] = "\t" + lines[i];
        }
      }
      const name = fileName.replace(/.+\/(.+).d.ts$/, '$1')
      declarations += `declare module "${this.name}/${name}" {\n${lines.join("\n")}\n}\n\n`;
    }
    return declarations;
  }

}
// @ts-ignore
export = ModuleFederationTypesPlugin;
