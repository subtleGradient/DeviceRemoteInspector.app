# hook.io Herd

A simple hook.io hook that spawns one child hook for each json config file in a given directory.

1. Create a bunch of config.json files.
2. Use the `childHooks` key to define the configs for hooks that will be spawned as child hooks
3. Use the `configFilePath` key in your child hook config to load the config from a separate file
    * NOTE: paths are relative to the json files as you would expect

### Example Config

    {
      "type":"herd",
      "name":"Simpsons",
      "childHooks":[
        {"type":"helloworld", "name":"Homer"},
        {"type":"helloworld", "name":"Marge"},
        {"configFilePath":"./simpson-kids/bart.config.json"},
        {"configFilePath":"./simpson-kids/lisa.config.json"},
        {"configFilePath":"./simpson-kids/maggie.config.json"}
      ]
    }
