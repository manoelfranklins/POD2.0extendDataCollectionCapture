# Data Collection Visual Threshold Validator - POD 2.0 Extension

A custom POD 2.0 widget that monitors Data Collection inputs and applies visual threshold validation styling in SAP Digital Manufacturing.

## Overview

This widget automatically detects Data Collection input fields in your POD and validates entered values against their min/max thresholds. It provides immediate visual feedback:

- **Green styling** - Value is within the acceptable range
- **Orange styling** - Value is outside the acceptable range (below min or above max)

**Note:** The widget panel is hidden by default at runtime. The validation styling works even when the panel is not visible.

## Features

- **Automatic Input Detection**: Finds all Data Collection input fields in the POD
- **Real-time Validation**: Validates values as they are entered
- **Visual Row Styling**: Highlights entire rows based on validation status
- **Input Border Styling**: Changes input border color to indicate status
- **Status Icons**: Shows checkmark or warning icons next to inputs
- **Hidden by Default**: Widget panel invisible at runtime (validation still active)
- **Configurable Properties**: Enable/disable features as needed

## Installation

### 1. Create the Extension Package

Create a ZIP file containing:
```
extension.json
widget/
    DataCollectionThresholds.js
```

### 2. Upload to SAP Digital Manufacturing

1. Navigate to **Manage PODs 2.0** app
2. Go to **Extensions** tab
3. Click **Create**
4. Fill in:
   - **Name**: DCThresholdValidator (or your preferred name)
   - **Namespace**: `custom/dcthresholds`
   - **Source Code**: Upload the ZIP file
5. Click **Create**

### 3. Add Widget to POD

1. Open your POD in Design Mode
2. Find **"DC Threshold Validator"** in the plugin palette under **Custom Widgets** category
3. Drag and drop it onto your POD layout
4. Save the POD

## Configuration

| Property | Default | Description |
|----------|---------|-------------|
| **Visible** | false | Show or hide the widget panel at runtime (validation still works when hidden) |
| **Enabled** | true | Enable or disable threshold validation |
| **Show Status Icons** | true | Show validation status icons next to inputs |
| **Log to Console** | true | Enable console logging for debugging |

## Visual Styling

### Valid (Within Limits)
- Row: Green gradient background with green left border
- Input: Green border with light green background
- Icon: Green checkmark

### Warning (Outside Limits)
- Row: Orange gradient background with orange left border
- Input: Orange border with light orange background
- Icon: Orange warning triangle

## How It Works

1. **Input Detection**: The widget polls the DOM for Data Collection input fields using multiple detection methods
2. **Threshold Extraction**: For each input, it extracts min/max values from:
   - Binding context data
   - Stored DC parameters from POD Context
3. **Live Validation**: Attaches live change listeners to inputs
4. **Visual Feedback**: Applies CSS styling based on validation results

## Input Detection Methods

The widget uses multiple methods to find DC inputs:
- DOM query for `input.sapMInputBaseInner`
- StepInput controls
- ID patterns (`dcParam`, `DataCollection`, `paramValue`, `actualValue`)
- Inputs within tables (`.sapMList`, `.sapUiTable`, `.sapMTable`)
- MutationObserver for dynamically added inputs

## Supported Data Properties

The widget looks for threshold values in these properties:
- `minValue`, `maxValue`
- `lowerLimit`, `upperLimit`
- `minLimit`, `maxLimit`
- `lowerSpecificationLimit`, `upperSpecificationLimit`
- `minSpecLimit`, `maxSpecLimit`

## Technical Details

- **Module Path**: `custom/dcthresholds/widget/DataCollectionThresholds`
- **Type**: `custom.dcthresholds.widget.DataCollectionThresholds`
- **Base Class**: `sap/dm/dme/pod2/widget/Widget`
- **Category**: Custom Widgets

## File Structure

```
├── extension.json                      # Extension configuration
├── README.md                           # This file
└── widget/
    └── DataCollectionThresholds.js     # Widget implementation
```

## Dependencies

- SAP Digital Manufacturing POD 2.0
- SAPUI5 libraries (included in DM)

## Comparison with POD 1.0 Version

This POD 2.0 version is a port of the original `extendDataCollectionCapture` extension:

| Feature | POD 1.0 Version | POD 2.0 Version |
|---------|-----------------|-----------------|
| Architecture | Plugin Extension | Widget |
| Integration | Extends DC Entry Plugin | Standalone widget |
| Configuration | Code-based | POD Designer properties |
| Deployment | Extension Provider | Manage PODs 2.0 |
| Default Visibility | Always visible | Hidden by default |

## Debugging

Enable "Log to Console" property to see detailed logs:
- `[DC Thresholds] Total inputs found: X`
- `[DC Thresholds] Input ID: ...`
- `[DC Thresholds] MutationObserver detected new inputs`

Check browser console (F12) for these messages.

## Notes

- Widget panel is hidden by default - validation styling still works
- Set "Visible" to true in properties if you want to see the panel
- The widget automatically re-validates when inputs change
- Continuous polling every 5 seconds to catch late-rendered inputs

## Version

1.0.0

## License

This project is licensed under the MIT License - see the LICENSE file for details.

👨‍💻 Author
Manoel Costa http://manoelcosta.com/

Disclaimer: This is a community extension and is not officially supported by SAP. Use at your own discretion.