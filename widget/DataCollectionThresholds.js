sap.ui.define([
    "sap/dm/dme/pod2/widget/Widget",
    "sap/dm/dme/pod2/widget/metadata/WidgetProperty",
    "sap/dm/dme/pod2/propertyeditor/BooleanPropertyEditor",
    "sap/dm/dme/pod2/propertyeditor/PropertyCategory",
    "sap/dm/dme/pod2/context/PodContext",
    "sap/m/Panel",
    "sap/m/Text",
    "sap/m/VBox",
    "sap/ui/core/Icon"
],
(
    Widget,
    WidgetProperty,
    BooleanPropertyEditor,
    PropertyCategory,
    PodContext,
    Panel,
    Text,
    VBox,
    Icon
) => {
    "use strict";

    console.log("=== DataCollectionThresholds MODULE LOADING ===");

    // CSS class names for styling
    const CSS_CLASSES = {
        ROW_VALID: "dcThreshold-row-valid",
        ROW_WARNING: "dcThreshold-row-warning",
        ROW_NEUTRAL: "dcThreshold-row-neutral",
        INPUT_VALID: "dcThreshold-input-valid",
        INPUT_WARNING: "dcThreshold-input-warning",
        ICON_VALID: "dcThreshold-icon-valid",
        ICON_WARNING: "dcThreshold-icon-warning",
        ANIMATED: "dcThreshold-animated"
    };

    // Validation status constants
    const VALIDATION_STATUS = {
        VALID: "valid",
        WARNING: "warning",
        NEUTRAL: "neutral"
    };

    /**
     * @class DataCollectionThresholds
     * @extends sap.dm.dme.pod2.widget.Widget
     * 
     * This widget monitors Data Collection inputs and applies threshold validation
     * with visual styling (green for valid, orange for out of range).
     */
    class DataCollectionThresholds extends Widget {

        static getDisplayName() {
            return "DC Threshold Validator";
        }

        static getDescription() {
            return "Monitors Data Collection inputs and applies visual threshold validation styling.";
        }

        static getIcon() {
            return "sap-icon://validate";
        }

        static getCategory() {
            return "Custom Widgets";
        }

        static getDefaultConfig() {
            return {
                properties: {
                    visible: false,     // Widget panel hidden by default at runtime
                    enabled: true,
                    showStatusIcons: true,
                    logToConsole: true  // Enable by default for debugging
                }
            };
        }

        _createView() {
            console.log("=== DataCollectionThresholds _createView ===");
            
            this._bStylesInjected = false;
            this._oParameterInputMap = {};
            this._aDcParameters = [];
            
            // Inject custom CSS styles
            this._injectStyles();
            
            // Subscribe to POD Context for DC data
            this._subscribeToDataCollection();
            
            // Start polling for inputs with more frequent checks
            this._startInputPolling();
            
            // Also set up a MutationObserver to detect when DC table is added
            this._setupMutationObserver();
            
            // Create info panel
            this._oStatusText = new Text({
                text: "Monitoring Data Collection inputs..."
            });
            
            // Store reference to panel for visibility control
            this._oPanel = new Panel(this.getId(), {
                headerText: "DC Threshold Validator",
                expandable: true,
                expanded: false,
                visible: this.getPropertyValue("visible"),  // Control visibility via property
                content: [
                    new VBox({
                        items: [this._oStatusText]
                    })
                ]
            });
            
            const oPanel = this._oPanel;
            
            console.log("=== DataCollectionThresholds view created ===");
            return oPanel;
        }

        _subscribeToDataCollection() {
            console.log("=== Subscribing to Data Collection context ===");
            
            // Subscribe to possible DC-related paths
            const aPaths = [
                "/dataCollection",
                "/selectedDataCollection",
                "/dcParameters",
                "/dataCollectionList"
            ];

            aPaths.forEach(sPath => {
                PodContext.subscribe(sPath, (oData) => {
                    this._log("DC data from " + sPath + ":", oData);
                    if (oData) {
                        this._handleDataCollectionData(oData);
                    }
                }, this);
            });
        }

        _handleDataCollectionData(oData) {
            // Extract DC parameters
            if (oData.dcParameterList) {
                this._aDcParameters = oData.dcParameterList;
                this._log("Stored " + this._aDcParameters.length + " DC parameters");
            } else if (oData.parameters) {
                this._aDcParameters = oData.parameters;
                this._log("Stored " + this._aDcParameters.length + " parameters");
            } else if (Array.isArray(oData)) {
                this._aDcParameters = oData;
                this._log("Stored " + this._aDcParameters.length + " parameters from array");
            }
            
            // Trigger input validation
            setTimeout(() => this._findAndStyleInputs(), 500);
        }

        _startInputPolling() {
            console.log("[DC Thresholds] Starting input polling...");
            // Poll for inputs with more frequent checks
            const delays = [500, 1000, 1500, 2000, 3000, 4000, 5000, 7000, 10000, 15000];
            delays.forEach(delay => {
                setTimeout(() => this._findAndStyleInputs(), delay);
            });
            
            // Also set up an interval for continuous monitoring
            this._pollingInterval = setInterval(() => {
                this._findAndStyleInputs();
            }, 5000);
        }

        _setupMutationObserver() {
            console.log("[DC Thresholds] Setting up MutationObserver...");
            
            // Observe DOM changes to detect when DC table is rendered
            this._mutationObserver = new MutationObserver((mutations) => {
                let bFoundInputs = false;
                mutations.forEach(mutation => {
                    if (mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) { // Element node
                                if (node.querySelector && node.querySelector('input.sapMInputBaseInner')) {
                                    bFoundInputs = true;
                                }
                            }
                        });
                    }
                });
                
                if (bFoundInputs) {
                    console.log("[DC Thresholds] MutationObserver detected new inputs");
                    setTimeout(() => this._findAndStyleInputs(), 300);
                }
            });
            
            this._mutationObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        _findAndStyleInputs() {
            if (!this.getPropertyValue("enabled")) {
                return;
            }

            console.log("[DC Thresholds] === Finding and styling inputs ===");
            
            // Find all input fields in the document
            const oCore = sap.ui.getCore();
            const aInputs = [];
            
            // Method 1: Search for inputs via DOM - sapMInputBaseInner
            document.querySelectorAll('input.sapMInputBaseInner').forEach(el => {
                const sParentId = el.parentElement?.id;
                if (sParentId) {
                    const oInput = oCore.byId(sParentId);
                    if (oInput && oInput.isA && oInput.isA("sap.m.Input")) {
                        if (aInputs.indexOf(oInput) === -1) {
                            aInputs.push(oInput);
                        }
                    }
                }
            });
            
            // Method 2: Search for StepInput controls (numeric)
            document.querySelectorAll('.sapMStepInput input').forEach(el => {
                const oParent = el.closest('.sapMStepInput');
                if (oParent && oParent.id) {
                    const oInput = oCore.byId(oParent.id);
                    if (oInput) {
                        console.log("[DC Thresholds] Found StepInput:", oInput.getId());
                    }
                }
            });
            
            // Method 3: Search by ID patterns that might indicate DC inputs
            document.querySelectorAll('[id*="dcParam"], [id*="DataCollection"], [id*="paramValue"], [id*="actualValue"]').forEach(el => {
                const oControl = oCore.byId(el.id);
                if (oControl && oControl.isA && oControl.isA("sap.m.Input")) {
                    if (aInputs.indexOf(oControl) === -1) {
                        aInputs.push(oControl);
                        console.log("[DC Thresholds] Found DC input by ID pattern:", oControl.getId());
                    }
                }
            });
            
            // Method 4: Search within tables
            document.querySelectorAll('.sapMList .sapMInput, .sapUiTable .sapMInput, .sapMTable .sapMInput').forEach(el => {
                const oControl = oCore.byId(el.id);
                if (oControl && oControl.isA && oControl.isA("sap.m.Input")) {
                    if (aInputs.indexOf(oControl) === -1) {
                        aInputs.push(oControl);
                        console.log("[DC Thresholds] Found table input:", oControl.getId());
                    }
                }
            });
            
            console.log("[DC Thresholds] Total inputs found: " + aInputs.length);
            
            // Log all input IDs for debugging
            aInputs.forEach(oInput => {
                console.log("[DC Thresholds] Input ID: " + oInput.getId());
            });
            
            if (aInputs.length === 0) {
                console.log("[DC Thresholds] No inputs found yet, will retry...");
                return;
            }
            
            // Update status
            if (this._oStatusText) {
                this._oStatusText.setText("Monitoring " + aInputs.length + " input fields");
            }
            
            // Process each input
            aInputs.forEach(oInput => {
                this._processInput(oInput);
            });
        }

        _processInput(oInput) {
            // Try to get parameter data from binding context
            const oContext = oInput.getBindingContext();
            const oRowData = oContext ? oContext.getObject() : null;
            
            let sParamName = null;
            let nMinValue = null;
            let nMaxValue = null;
            
            if (oRowData) {
                sParamName = oRowData.parameterName || oRowData.dcParameter || oRowData.parameter;
                nMinValue = oRowData.minValue || oRowData.lowerLimit || oRowData.minLimit || 
                           oRowData.lowerSpecificationLimit || oRowData.minSpecLimit;
                nMaxValue = oRowData.maxValue || oRowData.upperLimit || oRowData.maxLimit || 
                           oRowData.upperSpecificationLimit || oRowData.maxSpecLimit;
            }
            
            // Try to match from stored DC parameters
            if (sParamName && this._aDcParameters.length > 0) {
                const oParam = this._aDcParameters.find(p => 
                    p.parameterName === sParamName || p.dcParameter === sParamName
                );
                if (oParam) {
                    nMinValue = nMinValue || oParam.minValue || oParam.lowerLimit;
                    nMaxValue = nMaxValue || oParam.maxValue || oParam.upperLimit;
                }
            }
            
            this._log("Input: " + oInput.getId() + ", param: " + sParamName + 
                     ", min: " + nMinValue + ", max: " + nMaxValue);
            
            // Attach live change listener if not already done
            if (!oInput._dcThresholdAttached) {
                oInput._dcThresholdAttached = true;
                oInput._dcMinValue = nMinValue;
                oInput._dcMaxValue = nMaxValue;
                oInput._dcParamName = sParamName;
                
                oInput.attachLiveChange((oEvent) => {
                    const sValue = oEvent.getParameter("value");
                    const oSrc = oEvent.getSource();
                    this._log("LiveChange: " + sValue + " for " + oSrc._dcParamName);
                    
                    const oValidation = this._validateThreshold(
                        sValue, oSrc._dcMinValue, oSrc._dcMaxValue
                    );
                    this._applyValidationStyling(oSrc, oValidation);
                });
                
                this._log("Attached listener to: " + oInput.getId());
            }
            
            // Apply initial styling if there's a value
            const sCurrentValue = oInput.getValue();
            if (sCurrentValue && (nMinValue !== null || nMaxValue !== null)) {
                const oValidation = this._validateThreshold(sCurrentValue, nMinValue, nMaxValue);
                this._applyValidationStyling(oInput, oValidation);
            }
        }

        _validateThreshold(vValue, vMinValue, vMaxValue) {
            const oResult = {
                status: VALIDATION_STATUS.NEUTRAL,
                isValid: true,
                belowMin: false,
                aboveMax: false,
                message: "",
                value: vValue,
                minValue: vMinValue,
                maxValue: vMaxValue
            };

            // If no value entered, return neutral
            if (vValue === null || vValue === undefined || vValue === "") {
                oResult.message = "No value entered";
                return oResult;
            }

            const nValue = parseFloat(vValue);
            
            // If value is not a number, return neutral
            if (isNaN(nValue)) {
                oResult.message = "Non-numeric value";
                return oResult;
            }

            const nMinValue = (vMinValue !== null && vMinValue !== undefined && vMinValue !== "") ? 
                             parseFloat(vMinValue) : null;
            const nMaxValue = (vMaxValue !== null && vMaxValue !== undefined && vMaxValue !== "") ? 
                             parseFloat(vMaxValue) : null;

            // Check if both limits are missing
            if (nMinValue === null && nMaxValue === null) {
                oResult.message = "No limits defined";
                return oResult;
            }

            // Validate against min
            if (nMinValue !== null && !isNaN(nMinValue) && nValue < nMinValue) {
                oResult.belowMin = true;
                oResult.isValid = false;
            }

            // Validate against max
            if (nMaxValue !== null && !isNaN(nMaxValue) && nValue > nMaxValue) {
                oResult.aboveMax = true;
                oResult.isValid = false;
            }

            // Set status and message
            if (oResult.isValid) {
                oResult.status = VALIDATION_STATUS.VALID;
                oResult.message = "Value is within limits";
                if (nMinValue !== null && nMaxValue !== null) {
                    oResult.message = `Value ${nValue} is within range [${nMinValue} - ${nMaxValue}]`;
                }
            } else {
                oResult.status = VALIDATION_STATUS.WARNING;
                if (oResult.belowMin) {
                    oResult.message = `Value ${nValue} is below minimum (${nMinValue})`;
                } else if (oResult.aboveMax) {
                    oResult.message = `Value ${nValue} exceeds maximum (${nMaxValue})`;
                }
            }

            return oResult;
        }

        _applyValidationStyling(oInput, oValidation) {
            // Apply input styling
            oInput.removeStyleClass(CSS_CLASSES.INPUT_VALID);
            oInput.removeStyleClass(CSS_CLASSES.INPUT_WARNING);
            
            if (oValidation.status === VALIDATION_STATUS.VALID) {
                oInput.addStyleClass(CSS_CLASSES.INPUT_VALID);
            } else if (oValidation.status === VALIDATION_STATUS.WARNING) {
                oInput.addStyleClass(CSS_CLASSES.INPUT_WARNING);
            }
            
            // Apply row styling
            const oRow = this._findParentRow(oInput);
            if (oRow) {
                this._applyRowStyling(oRow, oValidation.status);
            }
            
            // Update status icon if enabled
            if (this.getPropertyValue("showStatusIcons")) {
                this._updateStatusIcon(oInput, oValidation);
            }
        }

        _findParentRow(oInput) {
            let oParent = oInput.getParent();
            
            while (oParent) {
                if (oParent.isA && (oParent.isA("sap.m.ColumnListItem") || 
                                   oParent.isA("sap.ui.table.Row"))) {
                    return oParent;
                }
                oParent = oParent.getParent ? oParent.getParent() : null;
            }
            
            return null;
        }

        _applyRowStyling(oRow, sStatus) {
            if (!oRow) return;

            const oDomRef = oRow.getDomRef ? oRow.getDomRef() : oRow;
            if (!oDomRef) return;

            // Remove all status classes
            oDomRef.classList.remove(CSS_CLASSES.ROW_VALID);
            oDomRef.classList.remove(CSS_CLASSES.ROW_WARNING);
            oDomRef.classList.remove(CSS_CLASSES.ROW_NEUTRAL);

            // Add appropriate class
            if (sStatus === VALIDATION_STATUS.VALID) {
                oDomRef.classList.add(CSS_CLASSES.ROW_VALID);
            } else if (sStatus === VALIDATION_STATUS.WARNING) {
                oDomRef.classList.add(CSS_CLASSES.ROW_WARNING);
            }
        }

        _updateStatusIcon(oInput, oValidation) {
            const sWrapperId = oInput.getId() + "-iconWrapper";
            let oExistingWrapper = document.getElementById(sWrapperId);
            
            if (oValidation.status === VALIDATION_STATUS.NEUTRAL) {
                if (oExistingWrapper) {
                    oExistingWrapper.remove();
                }
                return;
            }
            
            const oInputDom = oInput.getDomRef();
            if (!oInputDom) return;
            
            const oCell = oInputDom.closest("td") || oInputDom.closest(".sapMListTblCell") || oInputDom.parentElement;
            if (!oCell) return;
            
            // Make cell position relative if needed
            const oCellStyle = window.getComputedStyle(oCell);
            if (oCellStyle.position === "static") {
                oCell.style.position = "relative";
            }
            
            // Create or update wrapper
            if (!oExistingWrapper) {
                oExistingWrapper = document.createElement("span");
                oExistingWrapper.id = sWrapperId;
                oExistingWrapper.className = "dcThreshold-icon-wrapper";
                oCell.appendChild(oExistingWrapper);
            }
            
            // Position the wrapper
            const oInputRect = oInputDom.getBoundingClientRect();
            const oCellRect = oCell.getBoundingClientRect();
            const rightOffset = (oCellRect.right - oInputRect.right) + 8;
            
            oExistingWrapper.style.cssText = 
                "position: absolute !important;" +
                "right: " + rightOffset + "px;" +
                "top: 50%;" +
                "transform: translateY(-50%);" +
                "z-index: 100;" +
                "display: flex !important;" +
                "align-items: center;" +
                "pointer-events: auto;";
            
            // Create icon
            const sIconId = oInput.getId() + "-thresholdIcon";
            let oIcon = sap.ui.getCore().byId(sIconId);
            
            const oIconInfo = oValidation.status === VALIDATION_STATUS.VALID ? 
                { icon: "sap-icon://accept", cssClass: CSS_CLASSES.ICON_VALID } :
                { icon: "sap-icon://warning", cssClass: CSS_CLASSES.ICON_WARNING };
            
            if (oIcon) {
                oIcon.setSrc(oIconInfo.icon);
                oIcon.setTooltip(oValidation.message);
                oIcon.removeStyleClass(CSS_CLASSES.ICON_VALID);
                oIcon.removeStyleClass(CSS_CLASSES.ICON_WARNING);
                oIcon.addStyleClass(oIconInfo.cssClass);
            } else {
                oIcon = new Icon(sIconId, {
                    src: oIconInfo.icon,
                    tooltip: oValidation.message,
                    size: "14px"
                });
                oIcon.addStyleClass("dcThreshold-status-icon");
                oIcon.addStyleClass(oIconInfo.cssClass);
                oIcon.placeAt(oExistingWrapper);
            }
        }

        _injectStyles() {
            if (this._bStylesInjected) {
                return;
            }

            const sStyles = `
                /* DC Capture Thresholds - Visual Styles */
                
                .dcThreshold-row-valid {
                    background: linear-gradient(135deg, rgba(46, 204, 113, 0.12) 0%, rgba(39, 174, 96, 0.08) 100%) !important;
                    border-left: 4px solid #27ae60 !important;
                    transition: all 0.3s ease !important;
                }

                .dcThreshold-row-warning {
                    background: linear-gradient(135deg, rgba(243, 156, 18, 0.15) 0%, rgba(230, 126, 34, 0.10) 100%) !important;
                    border-left: 4px solid #e67e22 !important;
                    transition: all 0.3s ease !important;
                }

                .dcThreshold-input-valid input,
                .dcThreshold-input-valid .sapMInputBaseInner {
                    border-color: #27ae60 !important;
                    background-color: rgba(46, 204, 113, 0.05) !important;
                    box-shadow: 0 0 0 2px rgba(39, 174, 96, 0.15) !important;
                }

                .dcThreshold-input-warning input,
                .dcThreshold-input-warning .sapMInputBaseInner {
                    border-color: #e67e22 !important;
                    background-color: rgba(243, 156, 18, 0.05) !important;
                    box-shadow: 0 0 0 2px rgba(230, 126, 34, 0.15) !important;
                }

                .dcThreshold-status-icon {
                    display: inline-flex !important;
                    align-items: center;
                    justify-content: center;
                    width: 16px !important;
                    height: 16px !important;
                    border-radius: 50%;
                    animation: dcThreshold-fadeIn 0.3s ease;
                }

                .dcThreshold-icon-wrapper {
                    position: absolute !important;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 10;
                }

                .dcThreshold-icon-valid {
                    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
                    color: white !important;
                    box-shadow: 0 1px 4px rgba(39, 174, 96, 0.35);
                }

                .dcThreshold-icon-valid .sapUiIcon {
                    color: white !important;
                    font-size: 10px !important;
                }

                .dcThreshold-icon-warning {
                    background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
                    color: white !important;
                    box-shadow: 0 1px 4px rgba(230, 126, 34, 0.35);
                }

                .dcThreshold-icon-warning .sapUiIcon {
                    color: white !important;
                    font-size: 10px !important;
                }

                @keyframes dcThreshold-fadeIn {
                    0% { opacity: 0; transform: scale(0.5); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `;

            const oStyle = document.createElement("style");
            oStyle.id = "dcThreshold-custom-styles-pod2";
            oStyle.type = "text/css";
            oStyle.innerHTML = sStyles;
            document.head.appendChild(oStyle);

            this._bStylesInjected = true;
            this._log("Custom styles injected");
        }

        _log(sMessage, oData) {
            if (this.getPropertyValue("logToConsole")) {
                if (oData !== undefined) {
                    console.log("[DC Thresholds POD2] " + sMessage, oData);
                } else {
                    console.log("[DC Thresholds POD2] " + sMessage);
                }
            }
        }

        getProperties() {
            return [
                new WidgetProperty({
                    displayName: "Visible",
                    description: "Show or hide the widget panel at runtime (validation still works when hidden)",
                    category: PropertyCategory.Main,
                    propertyEditor: new BooleanPropertyEditor(this, "visible")
                }),
                new WidgetProperty({
                    displayName: "Enabled",
                    description: "Enable or disable threshold validation",
                    category: PropertyCategory.Main,
                    propertyEditor: new BooleanPropertyEditor(this, "enabled")
                }),
                new WidgetProperty({
                    displayName: "Show Status Icons",
                    description: "Show validation status icons next to inputs",
                    category: PropertyCategory.Main,
                    propertyEditor: new BooleanPropertyEditor(this, "showStatusIcons")
                }),
                new WidgetProperty({
                    displayName: "Log to Console",
                    description: "Enable console logging for debugging",
                    category: PropertyCategory.Main,
                    propertyEditor: new BooleanPropertyEditor(this, "logToConsole")
                })
            ];
        }

        getPropertyValue(sName) {
            const vValue = super.getPropertyValue(sName);
            
            switch (sName) {
                case "visible":
                    return vValue === true;  // Default to false (hidden)
                case "enabled":
                case "showStatusIcons":
                    return vValue !== false;
                case "logToConsole":
                    return vValue === true;
            }
            
            return vValue;
        }

        setPropertyValue(sName, vValue) {
            if (sName === "visible") {
                // Update panel visibility
                if (this._oPanel) {
                    this._oPanel.setVisible(vValue);
                }
            }
            if (sName === "enabled" && vValue) {
                // Re-run input detection when enabled
                setTimeout(() => this._findAndStyleInputs(), 500);
            }
            super.setPropertyValue(sName, vValue);
        }

        onExit() {
            console.log("=== DataCollectionThresholds onExit ===");
            
            PodContext.unsubscribeAll(this);
            
            // Stop polling
            if (this._pollingInterval) {
                clearInterval(this._pollingInterval);
            }
            
            // Disconnect mutation observer
            if (this._mutationObserver) {
                this._mutationObserver.disconnect();
            }
            
            // Remove injected styles
            const oStyle = document.getElementById("dcThreshold-custom-styles-pod2");
            if (oStyle) {
                oStyle.remove();
            }
            
            super.onExit && super.onExit();
        }
    }

    console.log("=== DataCollectionThresholds MODULE LOADED ===");

    return DataCollectionThresholds;
});