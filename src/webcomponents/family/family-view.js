/**
 * Copyright 2015-2019 OpenCB
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
import UtilsNew from "../../core/utilsNew.js";
import "../commons/forms/data-form.js";
import "../commons/view/pedigree-view.js";


export default class FamilyView extends LitElement {

    constructor() {
        super();

        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            family: {
                type: Object
            },
            familyId: {
                type: String
            },
            individualId: {
                type: Object
            },
            opencgaSession: {
                type: Object
            },
            settings: {
                type: Object
            }
        };
    }

    _init() {
        this.family = {};
        this.isLoading = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    update(changedProperties) {
        if (changedProperties.has("familyId")) {
            this.familyIdObserver();
        }
        if (changedProperties.has("individualId")) {
            this.individualIdObserver();
        }
        if (changedProperties.has("settings")) {
            this.settingsObserver();
        }
        super.update(changedProperties);
    }

    settingsObserver() {
        this._config = {...this.getDefaultConfig()};
        if (this.settings?.fields?.length) {
            this._config.hiddenFields = null;
            this._config = UtilsNew.mergeDataFormConfig(this._config, this.settings.fields);
        } else if (this.settings?.hiddenFields?.length) {
            this._config.hiddenFields = this.settings.hiddenFields;
            this._config = {...this._config, ...this.getDefaultConfig()}; // this is needed as we need to relauch getDefaultConfig() with the updated `hiddenFields` array

        }
        this.requestUpdate();
    }

    familyIdObserver() {
        if (this.familyId && this.opencgaSession) {
            this.isLoading = true;
            const query = {
                study: this.opencgaSession.study.fqn,
            };
            let error;
            this.opencgaSession.opencgaClient.families().info(this.familyId, query)
                .then(response => {
                    this.isLoading = false;
                    this.family = response.getResult(0);
                })
                .catch(function (reason) {
                    this.family = {};
                    error = reason;
                    console.error(reason);
                })
                .finally(() => {
                    this._config = this._config = {...this.getDefaultConfig(), ...this.config};
                    this.requestUpdate();
                    this.notify(error);
                });
        }
    }

    individualIdObserver() {
        if (this.individualId && this.opencgaSession) {
            const query = {
                members: this.individualId,
                study: this.opencgaSession.study.fqn
            };
            let error;
            this.opencgaSession.opencgaClient.families().search(query)
                .then(response => {
                    // Only takes the first family
                    this.family = response.getResult(0);
                })
                .catch(function (reason) {
                    this.family = {};
                    error = reason;
                    console.error(reason);
                })
                .finally(() => {
                    this._config = this._config = {...this.getDefaultConfig(), ...this.config};
                    this.requestUpdate();
                    this.notify(error);
                });
        }
    }

    onFilterChange(e) {
        this.familyId = e.detail.value;
    }

    notify(error) {
        this.dispatchEvent(new CustomEvent("familySearch", {
            detail: {
                value: this.family,
                status: {
                    // true if error is defined and not empty
                    error: !!error,
                    message: error
                }
            },
            bubbles: true,
            composed: true
        }));
    }

    getDefaultConfig() {
        return {
            title: "Summary",
            icon: "",
            display: {
                collapsable: true,
                showTitle: false,
                labelWidth: 2,
                defaultValue: "-"
            },
            sections: [
                {
                    title: "Search",
                    display: {
                        visible: family => !family?.id
                    },
                    elements: [
                        {
                            name: "Family ID",
                            field: "familyId",
                            type: "custom",
                            display: {
                                render: () => html `
                                    <family-id-autocomplete
                                        .value="${this.family?.id}"
                                        .opencgaSession="${this.opencgaSession}"
                                        .config=${{
                                            select2Config: {
                                                multiple: false
                                            }
                                        }}
                                        @filterChange="${e => this.onFilterChange(e)}">
                                    </family-id-autocomplete>`
                            }
                        }
                    ]
                },
                {
                    title: "General",
                    collapsed: false,
                    display: {
                        visible: family => family?.id
                    },
                    elements: [
                        {
                            name: "Family ID",
                            type: "custom",
                            display: {
                                render: data => html`<span style="font-weight: bold">${data.id}</span> (UUID: ${data.uuid})`
                            }
                        },
                        {
                            name: "Family Name",
                            field: "name"
                        },
                        {
                            name: "Disorders",
                            field: "disorders",
                            type: "list",
                            display: {
                                visible: !this._config?.hiddenFields?.includes("disorders"),
                                contentLayout: "bullets",
                                render: disorder => {
                                    let id = disorder.id;
                                    if (disorder.id.startsWith("OMIM:")) {
                                        id = html`<a href="https://omim.org/entry/${disorder.id.split(":")[1]}" target="_blank">${disorder.id}</a>`;
                                    }
                                    return html`${disorder.name} (${id})`;
                                },
                                defaultValue: "N/A"
                            }
                        },
                        {
                            name: "Phenotypes",
                            field: "phenotypes",
                            type: "list",
                            display: {
                                visible: !this._config?.hiddenFields?.includes("phenotypes"),
                                contentLayout: "bullets",
                                render: phenotype => {
                                    let id = phenotype.id;
                                    if (phenotype.id.startsWith("HP:")) {
                                        id = html`<a href="https://hpo.jax.org/app/browse/term/${phenotype.id}" target="_blank">${phenotype.id}</a>`;
                                    }
                                    return html`${phenotype.name} (${id})`;
                                },
                                defaultValue: "N/A"
                            }
                        },
                        {
                            name: "Creation Date",
                            field: "creationDate",
                            type: "custom",
                            display: {
                                visible: !this._config?.hiddenFields?.includes("creationDate"),
                                render: field => html`${UtilsNew.dateFormatter(field)}`
                            }
                        },
                        {
                            name: "Description",
                            field: "description",
                            display: {
                                visible: !this._config?.hiddenFields?.includes("description"),
                            }
                        }
                    ]
                },
                {
                    title: "Family Members",
                    display: {
                        visible: family => family?.id
                    },
                    elements: [
                        {
                            name: "List of Members:",
                            field: "members",
                            type: "table",
                            display: {
                                layout: "horizontal",
                                columns: [
                                    {
                                        name: "Individual ID", field: "id"
                                    },
                                    {
                                        name: "Sex", field: "sex"
                                    },
                                    {
                                        name: "Father ID", field: "father.id", defaultValue: "-"
                                    },
                                    {
                                        name: "Mother ID", field: "mother.id", defaultValue: "-"
                                    },
                                    {
                                        name: "Disorders",
                                        field: "disorders",
                                        type: "custom",
                                        display: {
                                            render: data => data?.length ? html`${data.map(d => d.id).join(", ")}` : "-"
                                        }
                                    },
                                    {
                                        name: "Phenotypes",
                                        field: "phenotypes",
                                        type: "custom",
                                        defaultValue: "-",
                                        display: {
                                            render: data => data?.length ? html`${data.map(d => d.id).join(", ")}` : "-"
                                        }
                                    },
                                    {
                                        name: "Life Status", field: "lifeStatus"
                                    }
                                ]
                            }
                        },
                        {
                            name: "Pedigree",
                            type: "custom",
                            display: {
                                layout: "vertical",
                                visible: !this._config?.hiddenFields?.includes("pedigree"),
                                render: data => html`<pedigree-view .family="${this.family}"></pedigree-view>`
                            }
                        }
                    ]
                }
            ]
        };
    }

    render() {

        // if (!this.family && this.familyId) {
        //     return html`
        //         <div class="alert alert-info">
        //             <i class="fas fa-3x fa-info-circle align-middle"></i> No family found.
        //         </div>
        //     `;
        // }

        if (this.isLoading) {
            return html`
                <h2>Loading Info...</h2>
            `;
        }

        return html`
            <data-form
                .data=${this.family}
                .config="${this._config}">
            </data-form>`;
    }

}

customElements.define("family-view", FamilyView);
