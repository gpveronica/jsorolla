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
import "../commons/opencga-browser.js";


export default class OpencgaJobBrowser extends LitElement {

    constructor() {
        super();

        // Set status and init private properties
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
            query: {
                type: Object
            },
            /* facetQuery: {
                type: Object
            },
            selectedFacet: {
                type: Object
            },*/
            settings: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "jb" + UtilsNew.randomString(6);

        // These are for making the queries to server
        /* this.facetFields = [];
        this.facetRanges = [];

        this.facetFieldsName = [];
        this.facetRangeFields = [];

        this.facets = new Set();
        this.facetFilters = [];

        this.facetActive = true;
        this.selectedFacet = {};
        this.selectedFacetFormatted = {};
        this.errorState = false;*/

        this._config = this.getDefaultConfig();
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    // NOTE turn updated into update here reduces the number of remote requests from 2 to 1 as in the grid components propertyObserver()
    // is executed twice in case there is external settings
    update(changedProperties) {
        if (changedProperties.has("settings")) {
            this.settingsObserver();
        }
        super.update(changedProperties);
    }

    settingsObserver() {
        this._config = {...this.getDefaultConfig()};
        // merge filter list, canned filters, detail tabs
        if (this.settings?.menu) {
            this._config.filter = UtilsNew.mergeFiltersAndDetails(this._config?.filter, this.settings);
        }

        if (this.settings?.table) {
            this._config.filter.result.grid = {...this._config.filter.result.grid, ...this.settings.table};
        }
        if (this.settings?.table?.toolbar) {
            this._config.filter.result.grid.toolbar = {...this._config.filter.result.grid.toolbar, ...this.settings.table.toolbar};
        }
    }

    getDefaultConfig() {
        return {
            title: "Jobs Browser",
            icon: "fab fa-searchengin",
            description: "",
            views: [
                {
                    id: "table-tab",
                    name: "Table result",
                    icon: "fa fa-table",
                    active: true
                },
                {
                    id: "facet-tab",
                    name: "Aggregation stats",
                    icon: "fas fa-chart-bar"
                }, /*
                {
                    id: "comparator-tab",
                    name: "Comparator"
                },*/
                {
                    id: "visual-browser-tab",
                    name: "Visual browser"
                }
            ],
            filter: {
                searchButton: false,
                sections: [
                    {
                        title: "Section title",
                        collapsed: false,
                        fields: [
                            {
                                id: "id",
                                name: "Job ID",
                                placeholder: "ID",
                                allowedValues: "",
                                defaultValue: "",
                                description: "Job ID. It must be a unique string within the study. An id will be autogenerated automatically if not provided.",
                                fileUpload: false
                            },
                            {
                                id: "tool",
                                name: "Analysis Tool ID",
                                placeholder: "Tool",
                                allowedValues: "",
                                defaultValue: "",
                                description: "Tool executed by the job"
                            },
                            {
                                id: "input",
                                name: "Input File Name",
                                placeholder: "e.g.  NA12877.vcf.gz",
                                allowedValues: "",
                                defaultValue: "",
                                description: "File used by the Tool",
                                fileUpload: false
                            },
                            {
                                id: "internal.status.name",
                                name: "Status",
                                placeholder: "Status",
                                allowedValues: ["PENDING", "QUEUED", "RUNNING", "DONE", "ERROR", "UNKNOWN", "REGISTERING", "UNREGISTERED", "ABORTED", "DELETED"],
                                defaultValue: "",
                                description: "Job internal status"
                            },
                            {
                                id: "priority",
                                name: "Priority",
                                placeholder: "Priority",
                                allowedValues: ["URGENT", "HIGH", "MEDIUM", "LOW"],
                                defaultValue: "",
                                description: "Priority of the job"
                            },
                            {
                                id: "tags",
                                name: "Tags",
                                placeholder: "Tags",
                                allowedValues: "",
                                defaultValue: "",
                                description: "Job tags"
                            },
                            {
                                id: "creationDate",
                                name: "Creation Date",
                                placeholder: "Creation Date",
                                description: "Creation date. Format: yyyyMMddHHmmss. Examples: >2018, 2017-2018, <201805"
                            },
                            {
                                id: "visited",
                                name: "Visited",
                                placeholder: "Visited",
                                allowedValues: ["true", "false"],
                                defaultValue: "",
                                description: "Visited status of job"
                            }
                        ]
                    }
                ],
                examples: [
                    {
                        id: "Full",
                        active: false,
                        query: {
                            name: "bam",
                            path: "genomes",
                            sample: "hg3333",
                            format: "VCF,BCF,GVCF,BIGWIG",
                            bioformat: "ALIGNMENT",
                            creationDate: ">=20200216"
                        }
                    }
                ],
                grid: {
                    order: "AAAA"
                },
                result: {
                    grid: {}
                },
                detail: {
                    title: "Job",
                    showTitle: true,
                    items: [
                        {
                            id: "job-view",
                            name: "Overview",
                            active: true,
                            render: (job, active, opencgaSession) => {
                                return html`<opencga-job-view .opencgaSession=${opencgaSession} mode="simple" .job="${job}"></opencga-job-view>`;
                            }
                        },
                        {
                            id: "job-log",
                            name: "Logs",
                            render: (job, active, opencgaSession) => {
                                return html`
                                    <opencga-job-detail-log    .opencgaSession=${opencgaSession}
                                                                .active="${active}"
                                                                .job="${job}">
                                    </opencga-job-detail-log>
                                `;
                            }
                        },
                        {
                            id: "json-view",
                            name: "JSON Data",
                            mode: "development",
                            render: (job, active, opencgaSession) => {
                                return html`<json-viewer .data="${job}" .active="${active}"></json-viewer>`;
                            }
                        }
                    ]
                }
            },
            aggregation: {
                default: ["creationYear>>creationMonth", "toolId>>executorId"],
                result: {
                    numColumns: 2
                },
                sections: [
                    {
                        name: "Job attributes",
                        fields: [
                            {
                                id: "studyId",
                                name: "Study id",
                                type: "string",
                                description: "Study [[user@]project:]study where study and project can be either the ID or UUID"
                            },
                            {
                                id: "creationYear",
                                name: "Creation Year",
                                type: "string",
                                description: "Creation year"
                            },
                            {
                                id: "creationMonth",
                                name: "Creation Month",
                                type: "category",
                                allowedValues: ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"],
                                description: "Creation month (JANUARY, FEBRUARY...)"
                            },
                            {
                                id: "creationDay",
                                name: "Creation Day",
                                type: "category",
                                allowedValues: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"],
                                description: "Creation day"
                            },
                            {
                                id: "creationDayOfWeek",
                                name: "Creation Day Of Week",
                                type: "category",
                                allowedValues: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
                                description: "Creation day of week (MONDAY, TUESDAY...)"
                            },
                            {
                                id: "status",
                                name: "Status",
                                type: "category",
                                allowedValues: ["PENDING", "QUEUED", "RUNNING", "DONE", "ERROR", "UNKNOWN", "REGISTERING", "UNREGISTERED", "ABORTED", "DELETED"],
                                description: "Status"
                            },
                            {
                                id: "release",
                                name: "Release",
                                type: "string",
                                description: "Release"
                            },
                            {
                                id: "toolId",
                                name: "Tool Id",
                                type: "string",
                                description: "Tool id"
                            },
                            {
                                id: "toolScope",
                                name: "Tool Scope",
                                type: "category",
                                allowedValues: ["GLOBAL", "PROJECT", "STUDY"],
                                description: "Tool scope"
                            },
                            {
                                id: "toolType",
                                name: "Tool Type",
                                type: "category",
                                allowedValues: ["OPERATION", "ANALYSIS"],
                                description: "Tool type"
                            },
                            {
                                id: "toolResource",
                                name: "Tool Resource",
                                type: "category",
                                allowedValues: ["USER", "PROJECT", "STUDY", "FILE", "SAMPLE", "JOB", "INDIVIDUAL", "COHORT", "DISEASE_PANEL", "FAMILY", "CLINICAL_ANALYSIS", "INTERPRETATION", "VARIANT", "ALIGNMENT", "CLINICAL", "EXPRESSION", "FUNCTIONAL"],
                                description: "Tool resource"
                            },
                            {
                                id: "userId",
                                name: "User Id",
                                type: "string",
                                description: "User id"
                            },
                            {
                                id: "priority",
                                name: "Priority",
                                type: "category",
                                allowedValues: ["URGENT", "HIGH", "MEDIUM", "LOW"],
                                description: "Priority"
                            },
                            {
                                id: "tags",
                                name: "Tags",
                                type: "string",
                                description: "Tags"
                            },
                            {
                                id: "executorId",
                                name: "Executor Id",
                                type: "string",
                                description: "Executor id"
                            },
                            {
                                id: "executorFramework",
                                name: "Executor Framework",
                                type: "string",
                                description: "Executor framework"
                            }
                        ]
                    },
                    {
                        name: "Advanced",
                        fields: [
                            {
                                id: "field",
                                name: "Field",
                                type: "string",
                                description: "List of fields separated by semicolons, e.g.: studies;type. For nested fields use >>, e.g.: studies>>biotype;type;numSamples[0..10]:1"
                            }
                        ]
                    }
                ]
            }
        };
    }

    render() {
        return this.opencgaSession && this._config ? html`
            <opencga-browser  resource="JOB"
                            .opencgaSession="${this.opencgaSession}"
                            .query="${this.query}"
                            .config="${this._config}">
            </opencga-browser>` : "";
    }

}

customElements.define("opencga-job-browser", OpencgaJobBrowser);
