/**
 * Copyright 2015-2021 OpenCB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {LitElement, html} from "lit";
import LitUtils from "../commons/utils/lit-utils.js";
import FormUtils from "../commons/forms/form-utils.js";
import NotificationUtils from "../commons/utils/notification-utils.js";
import Types from "../commons/types.js";
import UtilsNew from "../../core/utilsNew.js";
import "../study/phenotype/phenotype-list-update.js";
import "../study/annotationset/annotation-set-update.js";
import "../study/ontology-term-annotation/ontology-term-annotation-list-update.js";
import "../study/ontology-term-annotation/ontology-term-annotation-create.js";
import "../study/ontology-term-annotation/ontology-term-annotation-update.js";


export default class SampleCreate extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            opencgaSession: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this.sample = {};
        this.collection = {from: []};
        this.annotationSet = {};
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    // connectedCallback() {
    //     super.connectedCallback();
    //     this._config = {...this.getDefaultConfig(), ...this.config};
    // }

    refreshForm() {
        // When using data-form we need to update config object and render again
        this._config = {...this.getDefaultConfig(), ...this.config};
        this.requestUpdate();
    }

    dispatchSessionUpdateRequest() {
        LitUtils.dispatchCustomEvent(this, "sessionUpdateRequest");
    }

    onFieldChange(e, field) {
        const param = field || e.detail.param;
        switch (param) {
            case "id":
            case "description":
            case "somatic":
            case "individualId":
            case "status.name":
            case "status.description":
            case "processing.product":
            case "processing.preparationMethod":
            case "processing.extractionMethod":
            case "processing.labSambpleId":
            case "processing.quantity":
            case "processing.date":
            case "collection.type":
            case "collection.quantity":
            case "collection.method":
            case "collection.date":
                this.sample = {
                    ...FormUtils.createObject(
                        this.sample,
                        param,
                        e.detail.value
                    )
                };
                break;
            case "phenotypes":
                // this.sample = {...this.sample, phenotypes: e.detail.value};
                break;
            case "annotationSets":
                // Rodiel (03/03/2022): At the moment IVA DOES NOT SUPPORT
                // creating annotation sets
                this.sample = {...this.sample, annotationSets: e.detail.value};
                break;
        }
        this.requestUpdate();
    }

    onClear(e) {
        Swal.fire({
            title: "Are you sure to clear?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
            reverseButtons: true
        }).then(result => {
            if (result.isConfirmed) {
                this.sample = {};
                this.requestUpdate();
                Swal.fire(
                    "Cleaned!",
                    "The fields has been cleaned.",
                    "success"
                );
            }
        });
    }

    onSubmit(e) {
        e.stopPropagation();
        console.log("onSubmit", this.sample);
        this.opencgaSession.opencgaClient
            .samples()
            .create(this.sample, {study: this.opencgaSession.study.fqn})
            .then(res => {
                this.sample = {};
                this.requestUpdate();
                NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_SUCCESS, {
                    title: "New Sample",
                    message: "Sample created correctly"
                });
            })
            .catch(err => {
                NotificationUtils.dispatch(this, NotificationUtils.NOTIFY_RESPONSE, err);
            });
    }

    onAddOrUpdateItem(e) {
        console.log("Change received on the array", this);
        switch (e.detail.param) {
            case "collection.from":
                this.collection = {...this.collection, from: e.detail.value};
                this.sample = {...this.sample, collection: this.collection};
                break;
            case "phenotypes":
                this.sample = {...this.sample, phenotypes: e.detail.value};
                break;
            case "annotationSets":
                console.log("for annotationSets array");
                break;
        }
        this._config = {...this.getDefaultConfig(), ...this.config};
        this.requestUpdate();
    }

    render() {
        return html`
            <data-form
                .data=${this.sample}
                .config="${this._config}"
                @fieldChange="${e => this.onFieldChange(e)}"
                @addOrUpdateItem="${e => this.onAddOrUpdateItem(e)}"
                @clear="${e => this.onClear(e)}"
                @submit="${e => this.onSubmit(e)}">
            </data-form>`;
    }

    getDefaultConfig() {
        return Types.dataFormConfig({
            // title: "Sample Create",
            type: "form",
            display: {
                style: "margin: 10px",
                titleWidth: 3,
                defaultLayout: "horizontal",
                buttonClearText: "Cancel"
            },
            sections: [{
                title: "Sample General Information",
                elements: [
                    {
                        title: "Sample ID",
                        field: "id",
                        type: "input-text",
                        required: true,
                        display: {
                            placeholder: "Add a short ID...",
                            helpMessage: "short sample id...",
                        },
                    },
                    {
                        title: "Description",
                        field: "description",
                        type: "input-text",
                        display: {
                            rows: 3,
                            placeholder: "Add a description..."
                        }
                    },
                    {
                        title: "Individual ID",
                        field: "individualId",
                        type: "custom",
                        display: {
                            placeholder: "e.g. Homo sapiens, ...",
                            render: () => html`
                                <individual-id-autocomplete
                                    .value="${this.sample?.individualId}"
                                    .opencgaSession="${this.opencgaSession}"
                                    @filterChange="${e =>
                                        this.onFieldChange({
                                        detail: {
                                            param: "individualId",
                                            value: e.detail.value
                                        }
                                    })}">
                                </individual-id-autocomplete>`
                        }
                    },
                    {
                        title: "Somatic",
                        field: "somatic",
                        type: "checkbox",
                        checked: false
                    },
                    {
                        title: "Status name",
                        field: "status.name",
                        type: "input-text",
                        display: {
                            placeholder: "Add status name..."
                        }
                    },
                    {
                        title: "Status Description",
                        field: "status.description",
                        type: "input-text",
                        validation: {
                            validate: () => this.sample?.status?.description ? !!this.sample?.status?.name : true,
                            message: "The status name must be filled",
                        },
                        display: {
                            rows: 3,
                            placeholder: "Add a status description..."
                        }
                    }
                ]
            },
            {
                title: "Processing Info",
                elements: [
                    {
                        title: "Product",
                        field: "processing.product",
                        type: "custom",
                        display: {
                            render: product => html`
                                <ontology-term-annotation-create
                                    .ontology=${product}
                                    .displayConfig="${{
                                            defaultLayout: "vertical",
                                            buttonsVisible: false,
                                            width: 12,
                                            style: "border-left: 2px solid #0c2f4c; padding-left: 12px",
                                        }}"
                                    @fieldChange=${e => this.onFieldChange(e, "processing.product")}
                                ></ontology-term-annotation-create>`
                        }
                    },
                    {
                        title: "Preparation Method",
                        field: "processing.preparationMethod",
                        type: "input-text",
                        display: {
                            placeholder: "Add a preparation method..."
                        }
                    },
                    {
                        title: "Extraction Method",
                        field: "processing.extractionMethod",
                        type: "input-text",
                        display: {
                            placeholder: "Add a extraction method..."
                        }
                    },
                    {
                        title: "Lab Sample ID",
                        field: "processing.labSambpleId",
                        type: "input-text",
                        display: {
                            placeholder: "Add the lab sample ID..."
                        }
                    },
                    {
                        title: "Quantity",
                        field: "processing.quantity",
                        type: "input-text",
                        display: {
                            placeholder: "Add a quantity..."
                        }
                    },
                    {
                        title: "Date",
                        field: "processing.date",
                        type: "input-date",
                        display: {
                            render: date =>
                                moment(date, "YYYYMMDDHHmmss").format(
                                    "DD/MM/YYYY"
                                )
                        }
                    }
                ]
            },
            {
                title: "Collection Info",
                elements: [
                    {
                        title: "From",
                        field: "collection.from",
                        type: "custom-list",
                        display: {
                            style: "border-left: 2px solid #0c2f4c; padding-left: 12px; margin-bottom:24px",
                            collapsedUpdate: true,
                            renderUpdate: (from, callback) => {
                                return html`
                                <ontology-term-annotation-update
                                    .ontology="${from}"
                                    .displayConfig="${{
                                            defaultLayout: "vertical",
                                            style: "margin-bottom:0px",
                                            buttonOkText: "Save",
                                            buttonClearText: "",
                                        }}"
                                    @updateItem="${callback}">
                                </ontology-term-annotation-update>`;
                            },
                            renderCreate: (from, callback) => html`
                                <label>Create new item</label>
                                <ontology-term-annotation-create
                                    .displayConfig="${{
                                            defaultLayout: "vertical",
                                            buttonOkText: "Add",
                                            buttonClearText: "",
                                        }}"
                                    @addItem="${callback}">
                                </ontology-term-annotation-create>`
                        }
                    },
                    {
                        title: "Type",
                        field: "collection.type",
                        type: "input-text",
                        display: {
                            placeholder: "Add an type..."
                        }
                    },
                    {
                        title: "Quantity",
                        field: "collection.quantity",
                        type: "input-text",
                        display: {
                            placeholder: "Add a quantity..."
                        }
                    },
                    {
                        title: "Method",
                        field: "collection.method",
                        type: "input-text",
                        display: {
                            placeholder: "Add a method..."
                        }
                    },
                    {
                        title: "Date",
                        field: "collection.date",
                        type: "input-date",
                        display: {
                            render: date =>
                                moment(date, "YYYYMMDDHHmmss")
                                    .format("DD/MM/YYYY")
                        }
                    },
                ]
            },
            {
                title: "Phenotypes",
                elements: [
                    {
                        title: "Phenotype",
                        field: "phenotypes",
                        type: "custom-list",
                        display: {
                            style: "border-left: 2px solid #0c2f4c; padding-left: 12px; margin-bottom:24px",
                            collapsedUpdate: true,
                            renderUpdate: (pheno, callback) => html`
                                <ontology-term-annotation-update
                                    ontology=${pheno}
                                    .entity="${"phenotype"}"
                                    .displayConfig="${{
                                        defaultLayout: "vertical",
                                        buttonOkText: "Save",
                                        buttonClearText: "",
                                    }}"
                                    @updateItem="${callback}">
                                </ontology-term-annotation-update>
                            `,
                            renderCreate: (pheno, callback) => html`
                                <label>Create new item</label>
                                <ontology-term-annotation-create
                                    .entity="${"phenotype"}"
                                    .displayConfig="${{
                                        defaultLayout: "vertical",
                                        buttonOkText: "Add",
                                        buttonClearText: "",
                                    }}"
                                    @addItem="${callback}">
                                </ontology-term-annotation-create>
                            `
                        }
                    },
                ]
            },
            // {
            //     title: "Annotations Sets",
            //     elements: [
            //         {
            //             field: "annotationSets",
            //             type: "custom",
            //             display: {
            //                 layout: "vertical",
            //                 defaultLayout: "vertical",
            //                 width: 12,
            //                 style: "padding-left: 0px",
            //                 render: sample => html`
            //                     <annotation-set-update
            //                         .annotationSets="${sample?.annotationSets}"
            //                         .opencgaSession="${this.opencgaSession}"
            //                         @changeAnnotationSets="${e => this.onFieldChange(e, "annotationSets")}">
            //                     </annotation-set-update>
            //                 `
            //             }
            //         }
            //     ]
            // }
            ]
        });
    }

}

customElements.define("sample-create", SampleCreate);
