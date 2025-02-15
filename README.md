# FiveMDevKit

**FiveMDevKit** is a Visual Studio Code extension that streamlines FiveM development for JavaScript and TypeScript. It provides robust IntelliSense support for FiveM natives and common events, automatically transforming native names to a clean, PascalCase format with detailed parameter hints and documentation.

## Features

- **Intelligent Auto-Completion**  
  Provides suggestions for all FiveM natives from the official documentation. Natives are displayed in PascalCase with parameter hints and documentation extracted from FiveM's JSON data.

- **Custom Event Completions**  
  Supports common FiveM events like `onNet`, `emitNet`, `on`, `registerNetEvent`, and `triggerEvent` with snippets that insert boilerplate code.

- **Snippet Insertion with Parameter Types**  
  When a native is selected, a multi-line snippet is inserted with each parameter on its own line and type annotations. For example:
  ```js
  TriggerMusicEvent(
      eventName: string
  );
  ```

- **Integrated Documentation**  
  Hover over completion items to see detailed information, including native module, hash, parameters, and return type(s).

## Requirements

- **Visual Studio Code** (v1.97.0 or later recommended)
- A valid `natives.json` file placed in the extension's `data` folder.  
  *(Use the provided fetch script to update this file with the latest FiveM natives from [https://runtime.fivem.net/doc/natives.json](https://runtime.fivem.net/doc/natives.json).)*

## Extension Settings

At this stage, **FiveMDevKit** does not include custom configuration settings. Future releases may add settings to customize behavior, such as toggling certain completions or adjusting snippet formats.

## Known Issues

- **Event Completion Display:**  
  Some native names may not convert perfectly to PascalCase if the naming is inconsistent. Improvements to the name conversion algorithm are planned.
- **Performance:**  
  If your `natives.json` file grows very large, there might be a slight delay during activation. Consider filtering or optimizing the data for production use.

## Release Notes

### 1.0.0
- Initial release with full IntelliSense support for FiveM natives and common events.
- Snippets for events like `onNet`, `emitNet`, `on`, `registerNetEvent`, and `triggerEvent`.
- Integrated documentation for each native, including parameters, return types, and native hash.

## How to Use

1. **Install the Extension:**  
   Download and install the extension from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/) or install from the VSIX package.

2. **Ensure Data Availability:**  
   Verify that your `natives.json` file is up-to-date in the `data` folder. Use the provided fetch script to update it if necessary.

3. **Start Coding:**  
   Open a JavaScript or TypeScript file in VS Code. Begin typing a native (e.g., `TriggerMusicEvent`) or a common event (e.g., `onNet`) to see suggestions and snippets.
   
4. **View Documentation:**  
   Hover over any completion item to view details about the native, including its parameters and expected return type.

## Additional Resources

- [FiveM Documentation](https://docs.fivem.net/natives)
- [Visual Studio Code API](https://code.visualstudio.com/api)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)

## Contributing

Contributions are welcome! If you have ideas for improvements, bug fixes, or additional features, please feel free to open issues or submit pull requests.

**Enjoy FiveMDevKit and happy coding!**
