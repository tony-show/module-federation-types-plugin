export = ModuleFederationTypesPlugin;
declare class ModuleFederationTypesPlugin {
  /**
   * @param {PluginOptions} [options]
   */
  constructor(options?: PluginOptions | undefined);
  /**
   * @param {Compiler} compiler
   */
  apply(compiler: Compiler): void;
}

type PluginOptions = {
  name: string
  typeOut?: string
  exposes?: Record<string, string>
  remotes?: Record<string, string>
  remoteTypesDir?: string
  clearOnStart?: string
  clearOnEnd?: string
};
type Compiler = import("webpack").Compiler;
