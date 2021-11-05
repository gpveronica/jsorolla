/*
 * Copyright 2015-2016 OpenCB
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
import {NotificationQueue} from "../../core/NotificationQueue.js";
import OpencgaCatalogUtils from "../../core/clients/opencga/opencga-catalog-utils.js";
import "../commons/forms/data-form.js";
import "../commons/filters/clinical-priority-filter.js";

export default class ClinicalAnalysisCreate extends LitElement {

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
        this.clinicalAnalysis = {};
    }

    connectedCallback() {
        super.connectedCallback();

        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    update(changedProperties) {
        if (changedProperties.has("opencgaSession")) {
            // We store the available users from opencgaSession in 'clinicalAnalysis._users'
            this.clinicalAnalysis._users = [];
            if (this.opencgaSession?.study) {
                this._users = OpencgaCatalogUtils.getUsers(this.opencgaSession.study);
                this.initClinicalAnalysis();
            }

            this.requestUpdate();
        }

        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
        }
        super.update(changedProperties);
    }

    initClinicalAnalysis() {
        this.clinicalAnalysis = {
            type: "SINGLE",
            priority: "MEDIUM",
            analyst: {
                id: this.opencgaSession?.user?.id
            },
            dueDate: moment().format("YYYYMMDDHHmmss"),
            comments: [],
            _users: this._users
        };
    }

    onFieldChange(e) {
        switch (e.detail.param) {
            case "type":
                this.clinicalAnalysis.type = e.detail.value.toUpperCase();
                break;
            case "proband.id":
                this.clinicalAnalysis.proband = this.clinicalAnalysis.family.members.find(d => d.id === e.detail.value);
                if (this.clinicalAnalysis.proband?.disorders?.length > 0) {
                    this.clinicalAnalysis.disorder = {id: this.clinicalAnalysis.proband.disorders[0].id};
                }
                break;
            case "disorder.id":
                if (e.detail.value) {
                    const disorder = this.clinicalAnalysis.proband.disorders.find(d => e.detail.value === `${d.name} (${d.id})`);
                    this.clinicalAnalysis.disorder = {
                        id: disorder.id
                    };
                } else {
                    delete this.clinicalAnalysis.disorder;
                }
                break;
            case "analyst.id":
                this.clinicalAnalysis.analyst = {
                    id: e.detail.value
                };
                break;
            case "panels.id":
            case "flags.id":
                const [field, prop] = e.detail.param.split(".");
                if (e.detail.value) {
                    this.clinicalAnalysis[field] = e.detail.value.split(",").map(value => ({[prop]: value}));
                } else {
                    delete this.clinicalAnalysis[field];
                }
                break;
            case "_comments":
                this.clinicalAnalysis.comments = [
                    {
                        message: e.detail.value
                    }
                ];
                break;
            default:
                this.clinicalAnalysis[e.detail.param] = e.detail.value;
                break;
        }

        this.clinicalAnalysis = {...this.clinicalAnalysis};
        this.requestUpdate();
    }

    onCustomFieldChange(field, e) {
        this.onFieldChange({detail: {value: e.detail.value, param: field}});
    }

    onIndividualChange(e) {
        if (e.detail.value) {
            this.clinicalAnalysis.type = "SINGLE";
            this.opencgaSession.opencgaClient.individuals().info(e.detail.value, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    this.clinicalAnalysis.proband = response.responses[0].results[0];

                    if (this.clinicalAnalysis.proband?.disorders?.length === 1) {
                        this.clinicalAnalysis.disorder = {id: this.clinicalAnalysis.proband.disorders[0].id};
                    }

                    this.clinicalAnalysis = {...this.clinicalAnalysis};
                    this.requestUpdate();
                })
                .catch(reason => {
                    console.error(reason);
                });
        }
    }

    onFamilyChange(e) {
        if (e.detail.value) {
            this.clinicalAnalysis.type = "FAMILY";
            this.opencgaSession.opencgaClient.families().info(e.detail.value, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    this.clinicalAnalysis.family = response.responses[0].results[0];

                    // Select as proband the first son/daughter with a disorder
                    if (this.clinicalAnalysis.family && this.clinicalAnalysis.family.members) {
                        for (const member of this.clinicalAnalysis.family.members) {
                            if (member.disorders && member.disorders.length > 0 && member.father.id && member.mother.id) {
                                this.clinicalAnalysis.proband = member;
                                break;
                            }
                        }
                    }

                    if (this.clinicalAnalysis.proband?.disorders?.length === 1) {
                        this.clinicalAnalysis.disorder = {id: this.clinicalAnalysis.proband.disorders[0].id};
                    }

                    this.clinicalAnalysis = {...this.clinicalAnalysis};
                    this.requestUpdate();
                })
                .catch(reason => {
                    console.error(reason);
                });
        }
    }

    onCancerChange(e) {
        if (e.detail.value) {
            this.clinicalAnalysis.type = "CANCER";
            this.opencgaSession.opencgaClient.individuals().info(e.detail.value, {study: this.opencgaSession.study.fqn})
                .then(response => {
                    this.clinicalAnalysis.proband = response.responses[0].results[0];

                    if (this.clinicalAnalysis.proband?.disorders?.length === 1) {
                        this.clinicalAnalysis.disorder = {id: this.clinicalAnalysis.proband.disorders[0].id};
                    }

                    this.clinicalAnalysis = {...this.clinicalAnalysis};
                    this.requestUpdate();
                })
                .catch(reason => {
                    console.error(reason);
                });
        }
    }

    notifyClinicalAnalysisWrite() {
        this.dispatchEvent(new CustomEvent("clinicalAnalysisCreate", {
            detail: {
                id: this.clinicalAnalysis.id,
                clinicalAnalysis: this.clinicalAnalysis
            },
            bubbles: true,
            composed: true
        }));
    }

    renderPanels(selectedPanels) {
        const panels = this.opencgaSession.study.panels;
        const selectedValues = selectedPanels?.map(panel => panel.id).join(",");
        return html`
            <div class="">
                <select-field-filter
                    .data="${panels}"
                    .value="${selectedValues}"
                    .multiple="${true}"
                    @filterChange="${e => {
                        e.detail.param = "panels.id";
                        this.onFieldChange(e);
                    }}">
                </select-field-filter>
            </div>
        `;
    }

    renderFlags(flags) {
        const studyFlags = this.opencgaSession.study.internal.configuration?.clinical.flags[this.clinicalAnalysis.type.toUpperCase()];
        const selectedValues = flags?.map(flag => flag.id).join(",");
        return html`
            <div>
                <select-field-filter
                    .data="${studyFlags}"
                    .value="${selectedValues}"
                    .multiple="${true}"
                    @filterChange="${e => {
                        e.detail.param = "flags.id";
                        this.onFieldChange(e);
                    }}">
                </select-field-filter>
            </div>
        `;
    }

    onClear() {
        this.initClinicalAnalysis();
        this.requestUpdate();
    }

    onSubmit() {
        // Prepare the data for the REST create
        try {
            const data = {...this.clinicalAnalysis};
            // remove private fields
            delete data._users;

            data.proband = {
                id: this.clinicalAnalysis.proband?.id ? this.clinicalAnalysis.proband.id : null
            };

            if (data.type === "FAMILY") {
                data.family = {
                    id: this.clinicalAnalysis.family.id,
                    members: this.clinicalAnalysis.family.members.map(e => ({id: e.id}))
                };
            }

            this.opencgaSession.opencgaClient.clinical().create(data, {study: this.opencgaSession.study.fqn, createDefaultInterpretation: true})
                .then(response => {
                    new NotificationQueue().push(`Clinical analysis ${response.responses[0].results[0].id} created successfully`, null, "success");
                    this.notifyClinicalAnalysisWrite();
                    this.onClear();
                })
                .catch(response => {
                    console.error(response);
                    UtilsNew.notifyError(response);
                });
        } catch (response) {
            console.log(response);
            UtilsNew.notifyError(response);
        }
    }

    render() {
        return html`
            <data-form
                .data="${this.clinicalAnalysis}"
                .config="${this._config}"
                @fieldChange="${e => this.onFieldChange(e)}"
                @clear="${this.onClear}"
                @submit="${this.onSubmit}">
            </data-form>
        `;
    }

    getDefaultConfig() {
        return {
            id: "clinical-analysis",
            title: "Create Case",
            icon: "fas fa-user-md",
            type: "form",
            requires: "2.0.0",
            description: "Sample Variant Stats description",
            links: [
                {
                    title: "OpenCGA",
                    url: "http://docs.opencb.org/display/opencga/Sample+Stats",
                    icon: ""
                }
            ],
            buttons: {
                show: true,
                clearText: "Clear",
                submitText: "Create"
            },
            display: {
                width: "8",
                showTitle: false,
                infoIcon: "",
                labelAlign: "left",
                labelWidth: "4",
                defaultLayout: "horizontal"
            },
            sections: [
                {
                    title: "General Information",
                    display: {
                    },
                    elements: [
                        {
                            name: "Case ID",
                            field: "id",
                            type: "input-text",
                            required: true,
                            // validate: () => {},
                            defaultValue: "",
                            display: {
                                placeholder: "eg. AN-3",
                            }
                        },
                        {
                            name: "Analysis Type",
                            field: "type",
                            type: "select",
                            allowedValues: ["SINGLE", "FAMILY", "CANCER"],
                            defaultValue: "FAMILY",
                            errorMessage: "No found...",
                            display: {
                            }
                        },
                        {
                            name: "Disease Panels",
                            field: "panels",
                            type: "custom",
                            display: {
                                render: panels => this.renderPanels(panels)
                            }
                        },
                        {
                            name: "Flags",
                            field: "flags",
                            type: "custom",
                            display: {
                                render: flags => this.renderFlags(flags),
                            }
                        },
                        {
                            name: "Description",
                            field: "description",
                            type: "input-text",
                            defaultValue: "",
                            display: {
                                rows: 2,
                                placeholder: "Add a description to this case..."
                            }
                        }
                    ]
                },
                {
                    title: "Single Analysis Configuration",
                    display: {
                        visible: data => data.type && data.type.toUpperCase() === "SINGLE"
                    },
                    elements: [
                        {
                            name: "Select Proband",
                            field: "proband.id",
                            type: "custom",
                            display: {
                                render: data => {
                                    return html`
                                        <individual-id-autocomplete
                                            .opencgaSession="${this.opencgaSession}"
                                            .config=${{
                                                addButton: false,
                                                multiple: false
                                            }} @filterChange="${e => this.onIndividualChange(e)}">
                                        </individual-id-autocomplete>
                                    `;
                                }
                            }
                        },
                        {
                            name: "Select Disorder",
                            field: "disorder.id",
                            type: "select",
                            allowedValues: "proband.disorders",
                            required: true,
                            display: {
                                apply: disorder => `${disorder.name} (${disorder.id})`,
                                errorMessage: "No proband selected"
                            }
                        },
                        {
                            name: "Samples",
                            field: "proband.samples",
                            type: "table",
                            display: {
                                defaultLayout: "vertical",
                                errorMessage: "No proband selected",
                                errorClasses: "",
                                columns: [
                                    {
                                        name: "ID", type: "custom",
                                        display: {
                                            render: sample => html`
                                                <div><span style="font-weight: bold">${sample.id}</span></div>`
                                        }
                                    },
                                    {
                                        name: "Files", field: "fileIds", type: "custom",
                                        display: {
                                            render: fileIds => html`${fileIds.join("<br>")}`
                                        }
                                    },
                                    {
                                        name: "Status", field: "status.name", defaultValue: "-"
                                    }
                                ]
                            }
                        }
                    ]
                },
                {
                    title: "Family Analysis Configuration",
                    display: {
                        visible: data => data.type && data.type.toUpperCase() === "FAMILY"
                    },
                    elements: [
                        {
                            name: "Select Family",
                            field: "family.id",
                            type: "custom",
                            display: {
                                render: data => {
                                    return html`
                                        <family-id-autocomplete
                                            .opencgaSession="${this.opencgaSession}"
                                            .config=${{
                                                addButton: false,
                                                multiple: false
                                            }} @filterChange="${e => this.onFamilyChange(e)}">
                                        </family-id-autocomplete>
                                    `;
                                }
                            }
                        },
                        {
                            name: "Select Family",
                            field: "family.id",
                            type: "basic",
                            display: {
                            }
                        },
                        {
                            name: "Select Proband",
                            field: "proband.id",
                            type: "select",
                            allowedValues: "family.members",
                            required: true,
                            display: {
                                errorMessage: "No family selected"
                            }
                        },
                        {
                            name: "Select Disorder",
                            field: "disorder.id",
                            type: "select",
                            allowedValues: "proband.disorders",
                            required: true,
                            display: {
                                apply: disorder => `${disorder.name} (${disorder.id})`,
                                errorMessage: "No family selected"
                            }
                        },
                        {
                            name: "Members",
                            field: "family.members",
                            type: "table",
                            display: {
                                width: "12",
                                defaultLayout: "vertical",
                                errorMessage: "No family selected",
                                errorClasses: "",
                                columns: [
                                    {
                                        name: "Individual", type: "custom",
                                        display: {
                                            render: individual => html`
                                                <div><span style="font-weight: bold">${individual.id}</span></div>
                                                <div><span class="help-block">${individual.sex} (${individual.karyotypicSex})</span></div>`
                                        }
                                    },
                                    {
                                        name: "Sample", field: "samples", type: "custom",
                                        display: {
                                            render: samples => html`${samples[0].id}`
                                        }
                                    },
                                    {
                                        name: "Father", field: "father.id"
                                    },
                                    {
                                        name: "Mother", field: "mother.id"
                                    },
                                    {
                                        name: "Disorders", field: "disorders", type: "custom",
                                        display: {
                                            render: disorders => {
                                                if (disorders && disorders.length > 0) {
                                                    let id = disorders[0].id;
                                                    const name = disorders[0].name;
                                                    if (id?.startsWith("OMIM:")) {
                                                        id = html`<a href="https://omim.org/entry/${id.split(":")[1]}" target="_blank">${id}</a>`;
                                                    }
                                                    return html`${name} (${id})`;
                                                } else {
                                                    return html`<span>N/A</span>`;
                                                }
                                            }
                                        }
                                    }
                                ]

                            }
                        },
                        {
                            name: "Pedigree",
                            type: "custom",
                            display: {
                                defaultLayout: "vertical",
                                // visible: data => application.appConfig === "opencb", // TODO pedigree doesnt work with families with over 2 generations
                                render: data => {
                                    if (data.family) {
                                        return html`<pedigree-view .family="${data.family}"></pedigree-view>`;
                                    }
                                },
                                errorMessage: "No family selected"
                            }
                        }
                    ]
                },
                {
                    title: "Cancer Analysis Configuration",
                    collapsed: false,
                    display: {
                        visible: data => {
                            return data.type && data.type.toUpperCase() === "CANCER";
                        }
                    },
                    elements: [
                        {
                            name: "Select Proband",
                            type: "custom",
                            display: {
                                render: data => {
                                    return html`<individual-id-autocomplete .opencgaSession="${this.opencgaSession}" .config=${{
                                        addButton: false,
                                        multiple: false
                                    }} @filterChange="${e => this.onCancerChange(e)}"></individual-id-autocomplete>`;
                                }
                            }
                        },
                        {
                            name: "Select Disorder",
                            field: "disorder.id",
                            type: "select",
                            allowedValues: "proband.disorders",
                            required: true,
                            display: {
                                apply: disorder => `${disorder.name} (${disorder.id})`,
                                errorMessage: "No proband selected"
                            }
                        },
                        {
                            name: "Samples",
                            field: "proband.samples",
                            type: "table",
                            display: {
                                width: "12",
                                defaultLayout: "vertical",
                                errorMessage: "No proband selected",
                                errorClasses: "",
                                columns: [
                                    {
                                        name: "ID", type: "custom",
                                        display: {
                                            render: sample => html`
                                                <div><span style="font-weight: bold">${sample.id}</span></div>`
                                        }
                                    },
                                    {
                                        name: "Files", field: "fileIds", type: "custom",
                                        display: {
                                            render: fileIds => html`${fileIds.join("<br>")}`
                                        }
                                    },
                                    {
                                        name: "Somatic", field: "somatic"
                                    },
                                    {
                                        name: "Status", field: "status.name", defaultValue: "-"
                                    }
                                ]
                            }
                        }
                    ]
                },
                {
                    title: "Management Information",
                    elements: [
                        {
                            name: "Priority",
                            field: "priority",
                            type: "custom",
                            allowedValues: ["URGENT", "HIGH", "MEDIUM", "LOW"],
                            defaultValue: "MEDIUM",
                            display: {
                                render: priority => html`
                                    <clinical-priority-filter
                                        .config=${{multiple: false}}
                                        .priorities="${[...Object.values(this.opencgaSession.study.configuration?.clinical?.priorities || {})]}"
                                        @filterChange="${e => this.onCustomFieldChange("priority", e)}"
                                        .priority="${priority}">
                                    </clinical-priority-filter>`
                            }
                        },
                        {
                            name: "Assigned To",
                            field: "analyst.assignee",
                            type: "select",
                            defaultValue: this.opencgaSession?.user?.id,
                            allowedValues: "_users",
                            display: {
                            }
                        },
                        {
                            name: "Due Date",
                            field: "dueDate",
                            type: "input-date",
                            display: {
                                render: date => moment(date, "YYYYMMDDHHmmss").format("DD/MM/YYYY")
                            }
                        },
                        {
                            name: "Comment",
                            field: "_comments",
                            type: "input-text",
                            defaultValue: "",
                            display: {
                                rows: 2,
                                placeholder: "Initial comment..."
                                // render: comments => html`
                                //     <clinical-analysis-comment-editor .comments="${comments}" .opencgaSession="${this.opencgaSession}"></clinical-analysis-comment-editor>`
                            }
                        }
                    ]
                }
            ]
        };
    }

}

customElements.define("clinical-analysis-create", ClinicalAnalysisCreate);
