# Module Federation Types Plugin
Typing your microfrontends created with the Webpack Module Federation is easy! 🎉

# Description
This webpack plugin types the Webpack Module Federation microfrontends.

The plugin merges type declaration files (.d.ts) from common microfrontend modules, specified in the exposes object for the ModuleFederation plugin and created with the generated ts-loader (see configuration settings below), into one declaration file.

In addition, the plugin allows you to upload type declaration files (.d.ts) from the specified URLs to the microfrontends, in the remotes object for the ModuleFederation plugin.

# Options:

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|**`name`**|`String`|required option|Name of your app (like `name` option in ModuleFederation)|
|**`outDir`**|`String`|``types``|The path where the generated type declaration file will be saved in the project build folder (for the current application)|
|**`exposes`**|`Object`|`undefined`|The object `exposes` the entities you are sharing (like `exposes` option in ModuleFederation)|
|**`remotes`**|`Object`|`undefined`|The object `remotes` with url adreses to remoteEntry files of your microfrontends (like `remotes` option in ModuleFederation)|
|**`remoteTypesDir`**|`String`|`../../src/microfrontends/types`|The path to which the type declarations (.d.ts) files of your microfronts specified in the `remotes` option will be downloaded|
|**`clearOnStart`**|`String`|`undefined`|The path to the folder to be delete before build|
|**`clearOnEnd`**|`String`|undefined|The path to the folder to be delete after the build|


# Example configuration:
**In host app:**
```javascript
//webpack.config.ts
import ModuleFederationTypesPlugin from 'module-federation-types-plugin'

const appName = 'app'
const exposes = {
  './component': './src/component',
  './component_2': './src/component_2'
} // ModuleFederationTypesPlugin generate one file with types declaration for your exposes modules
const remotes = export const prodRemotes = {
  app1: 'app1@http://127.0.0.1:3000/remoteEntry.js',  // ModuleFederationTypesPlugin download app1.d.ts file from this URL
  app2: 'app2@http://127.0.0.1:3001/remoteEntry.js' // ModuleFederationTypesPlugin download app2.d.ts file from this URL
}

//...
  module: {
    rules: {
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              declaration: true, // generate type declaration files for all project
              declarationDir: 'types', // This folder with genereted .d.ts files for all project may be delete with option cleareOnStart in ModuleFederationTypesPlugin after build
            },
          },
        },
      ],
    }
  },
  plugins: [
    new ModuleFederationPlugin({
      name: appName,
      filename: 'remoteEntry.js',
      exposes: exposes,
      remotes: remotes,
    }),
    new ModuleFederationTypesPlugin({
      name: appName,
      outDir: `./types`,
      exposes: exposes,
      remotes: remotes,
      remoteTypesDir: './src/types',
      clearOnStart: 'build',
      clearOnEnd: 'types',
    }),
  ]
// ...
```

**After build**

`build/types` folder (generated .d.ts file)
```javascript
  // build/types/app.d.ts
  declare module "app/component" {
    //... component types
  }

  declare module "app/component_2" {
    //... component_2 types
  }
```

`src/types` folder (downloaded .d.ts files)
```javascript
  app1.d.ts
  app2.d.ts
```
