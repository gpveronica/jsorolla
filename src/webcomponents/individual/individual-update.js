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
import FormUtils from "../../webcomponents/commons/forms/form-utils.js";
import "../study/phenotype/phenotype-list-update.js";
import "../commons/tool-header.js";
import LitUtils from "../commons/utils/lit-utils";

export default class IndividualUpdate extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            individual: {
                type: Object
            },
            individualId: {
                type: String
            },
            opencgaSession: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this.individual = {};
        this.updateParams = {};
    }

    connectedCallback() {
        super.connectedCallback();
        this.updateParams = {};
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    update(changedProperties) {
        if (changedProperties.has("individual")) {
            this.individualObserver();
        }
        if (changedProperties.has("individualId")) {
            this.individualIdObserver();
        }
        super.update(changedProperties);
    }

    individualObserver() {
        if (this.individual) {
            this._individual = JSON.parse(JSON.stringify(this.individual));
        }
    }

    individualIdObserver() {
        if (this.opencgaSession && this.individualId) {
            const query = {
                study: this.opencgaSession.study.fqn,
            };
            this.opencgaSession.opencgaClient.individuals().info(this.individualId, query)
                .then(response => {
                    this.individual = response.responses[0].results[0];
                    // this.requestUpdate();
                })
                .catch(reason => {
                    console.error(reason);
                });
        }
    }

    onFieldChange(e) {
        switch (e.detail.param) {
            case "id":
            case "name":
            case "father":
            case "mother":
            case "sex":
            case "ethnicity":
            case "parentalConsanguinity":
            case "karyotypicSex":
            case "lifeStatus":
                this.updateParams = FormUtils.updateScalar(this._individual, this.individual, this.updateParams, e.detail.param, e.detail.value);
                break;
            case "location.address":
            case "location.postalCode":
            case "location.city":
            case "location.state":
            case "location.country":
            case "population.name":
            case "population.subpopulation":
            case "population.description":
            case "status.name":
            case "status.description":
                this.updateParams = FormUtils.updateObjectWithProps(this._individual, this.individual, this.updateParams, e.detail.param, e.detail.value);
                break;
        }
        this.requestUpdate();
    }

    onClear() {
        // console.log("OnClear individual update");
        this._config = {...this.getDefaultConfig(), ...this.config};
        this.individual = JSON.parse(JSON.stringify(this._individual));
        this.updateParams = {};
        this.individualId = "";
    }

    onSubmit() {
        const params = {
            study: this.opencgaSession.study.fqn,
            phenotypesAction: "SET"
        };

        this.opencgaSession.opencgaClient.individuals()
            .update(this.individual.id, this.updateParams, params)
            .then(res => {
                // TODO get individual from database, ideally it should be returned by OpenCGA
                this._individual = JSON.parse(JSON.stringify(this.individual));
                this.updateParams = {};
                FormUtils.showAlert("Edit Individual", "Individual updated correctly", "success");
                // this.dispatchSessionUpdateRequest();
            })
            .catch(err => {
                console.error(err);
                // FormUtils.showAlert("Update Individual", "Individual not updated correctly", "error");
                FormUtils.notifyError(err);
            });
    }

    onSyncPhenotypes(e) {
        e.stopPropagation();
        this.updateParams = {...this.updateParams, phenotypes: e.detail.value};
    }

    render() {
        return html`
            <data-form
                .data=${this.individual}
                .config="${this._config}"
                .updateParams=${this.updateParams}
                @fieldChange="${e => this.onFieldChange(e)}"
                @clear="${this.onClear}"
                @submit="${this.onSubmit}">
            </data-form>
        `;
    }

    getDefaultConfig() {
        return {
            title: "Edit",
            icon: "fas fa-edit",
            type: "form",
            buttons: {
                show: true,
                cancelText: "Cancel",
                okText: "Save"
            },
            display: {
                labelWidth: 3,
                with: "8",
                labelAlign: "right",
                defaultLayout: "horizontal",
            },
            sections: [
                {
                    title: "Individual General Information",
                    elements: [
                        {
                            name: "Individual id",
                            field: "id",
                            type: "input-text",
                            display: {
                                placeholder: "Add a short ID...",
                                disabled: true,
                                help: {
                                    text: "short individual id for..."
                                },
                            }
                        },
                        {
                            name: "Name",
                            field: "name",
                            type: "input-text",
                            display: {
                                placeholder: "individual name..."
                            }
                        },
                        {
                            name: "Father id",
                            field: "father.id",
                            defaultValue: "-",
                            type: "input-text",
                            display: {}
                        },
                        {
                            name: "Mother id",
                            field: "mother.id",
                            defaultValue: "-",
                            type: "input-text",
                            display: {
                                placeholder: "individual name..."
                            }
                        },
                        {
                            name: "Sex",
                            field: "sex",
                            type: "select",
                            allowedValues: ["MALE", "FEMALE", "UNKNOWN", "UNDETERMINED"],
                            display: {}
                        },
                        {
                            name: "Birth",
                            field: "dateOfBirth",
                            type: "input-text",
                            display: {}
                        },
                        {
                            name: "Ethnicity",
                            field: "ethnicity",
                            type: "input-text",
                            display: {}
                        },
                        {
                            name: "Parental Consanguinity",
                            field: "parentalConsanguinity",
                            type: "checkbox",
                            display: {}
                        },
                        {
                            name: "Karyotypic Sex",
                            field: "karyotypicSex",
                            type: "select",
                            allowedValues: ["UNKNOWN", "XX", "XY", "XO", "XXY", "XXX", "XXYY", "XXXY", "XXXX", "XYY", "OTHER"],
                            display: {}
                        },
                        {
                            name: "Life Status",
                            field: "lifeStatus",
                            type: "select",
                            allowedValues: ["ALIVE", "ABORTED", "DECEASED", "UNBORN", "STILLBORN", "MISCARRIAGE", "UNKNOWN"],
                            display: {}
                        },
                    ]
                },
                {
                    title: "Location Info",
                    elements: [
                        {
                            name: "Address",
                            field: "location.address",
                            type: "input-text",
                            display: {}
                        },
                        {
                            name: "Portal code",
                            field: "location.postalCode",
                            type: "input-text",
                            display: {}
                        },
                        {
                            name: "City",
                            field: "location.city",
                            type: "input-text",
                            display: {}
                        },
                        {
                            name: "State",
                            field: "location.state",
                            type: "input-text",
                            display: {}
                        },
                        {
                            name: "Country",
                            field: "location.country",
                            type: "input-text",
                            display: {}
                        }
                    ]
                },
                {
                    title: "Population Info",
                    elements: [
                        {
                            name: "Population name",
                            field: "population.name",
                            type: "input-text",
                            display: {}
                        },
                        {
                            name: "Subpopulation",
                            field: "population.subpopulation",
                            type: "input-text",
                            display: {}
                        },
                        {
                            name: "populaton description",
                            field: "population.description",
                            type: "input-text",
                            display: {
                                rows: 3,
                                placeholder: "add a description...",
                            }
                        }
                    ]
                },
                {
                    title: "Phenotypes",
                    elements: [
                        {
                            field: "phenotype",
                            type: "custom",
                            display: {
                                layout: "vertical",
                                defaultLayout: "vertical",
                                width: 12,
                                style: "padding-left: 0px",
                                render: () => html`
                                <phenotype-list-update
                                    .phenotypes="${this.individual?.phenotypes}"
                                    .updateManager="${true}"
                                    .opencgaSession="${this.opencgaSession}"
                                    @changePhenotypes="${e => this.onSyncPhenotypes(e)}">
                                </phenotype-list-update>`
                            }
                        },
                    ]
                }
            ]
        };
    }

}

customElements.define("individual-update", IndividualUpdate);
