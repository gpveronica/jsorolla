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
import LitUtils from "../utils/lit-utils.js";
import UtilsNew from "../../../core/utilsNew.js";
import "../forms/select-token-filter.js";

export default class CatalogSearchAutocomplete extends LitElement {

    constructor() {
        super();

        this.#init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            opencgaSession: {
                type: Object
            },
            value: {
                type: Object
            },
            resource: {
                type: String,
            },
            searchField: {
                type: String,
            },
            query: {
                type: Object,
            },
            classes: {
                type: String
            },
            config: {
                type: Object
            }
        };
    }

    #init() {
        this.RESOURCES = {};
    }

    update(changedProperties) {
        if (changedProperties.has("opencgaSession")) {
            this.opencgaSessionObserver();
        }
        if (changedProperties.has("config")) {
            this._config = {...this.getDefaultConfig(), ...this.config};
        }
        super.update(changedProperties);
    }

    opencgaSessionObserver() {
        this.RESOURCES = {
            "SAMPLE": {
                searchField: "id",
                placeholder: "HG01879, HG01880, HG01881...",
                client: this.opencgaSession.opencgaClient.samples(),
                fields: item => ({
                    "name": item.id,
                    "Individual ID": item?.individualId
                }),
                query: {
                    include: "id,individualId"
                }
            },
            "INDIVIDUAL": {
                searchField: "id",
                placeholder: "Start typing",
                client: this.opencgaSession.opencgaClient.individuals(),
                fields: item => ({
                    "name": item.id
                }),
                query: {
                    include: "id"
                }
            },
            "FAMILY": {
                searchField: "id",
                placeholder: "Start typing",
                client: this.opencgaSession.opencgaClient.families(),
                fields: item => ({
                    "name": item.id
                }),
                query: {
                    include: "id"
                }
            },

            "CLINICAL_ANALYSIS": {
                searchField: "id",
                placeholder: "Start typing",
                client: this.opencgaSession.opencgaClient.clinical(),
                fields: item => ({
                    "name": item.id,
                    "Proband Id": item?.proband?.id
                }),
                query: {
                    include: "id,proband"
                }
            },
            "DISEASE_PANEL": {
                searchField: "id",
                placeholder: "Start typing",
                client: this.opencgaSession.opencgaClient.panels(),
                fields: item => ({
                    "name": item.id,
                }),
                query: {
                    include: "id"
                }
            },
            "JOB": {
                searchField: "id",
                placeholder: "Start typing",
                client: this.opencgaSession.opencgaClient.jobs(),
                fields: item => ({
                    "name": item.id,
                }),
                query: {
                    include: "id"
                }
            },
            "COHORT": {
                searchField: "id",
                placeholder: "Start typing",
                client: this.opencgaSession.opencgaClient.cohorts(),
                fields: item => ({
                    "name": item.id
                }),
                query: {
                    include: "id"
                }
            },
            "FILE": {
                searchField: "name",
                placeholder: "eg. samples.tsv, phenotypes.vcf...",
                client: this.opencgaSession.opencgaClient.files(),
                fields: item => ({
                    name: item.name,
                    Format: item.format ?? "N/A",
                    Size: UtilsNew.getDiskUsage(item.size)
                }),
                query: {
                    type: "FILE",
                    include: "id,name,format,size,path",
                }
            },
            "DIRECTORY": {
                searchField: "path",
                placeholder: "eg. /data/platinum-grch38...",
                client: this.opencgaSession.opencgaClient.files(),
                fields: item => ({
                    name: item.name,
                    path: `/${item.path.replace(`/${item.name}`, "")}`
                }),
                query: {
                    type: "DIRECTORY",
                    include: "id,path",
                }
            }
        };
        this._config = this.getDefaultConfig();
    }

    onFilterChange(value) {
        LitUtils.dispatchCustomEvent(this, "filterChange", value);
    }

    render() {
        if (!this.resource) {
            return html`resource not provided`;
        }

        return html`
            <select-token-filter
                .opencgaSession="${this.opencgaSession}"
                .config="${this._config}"
                .classes="${this.classes}"
                .value="${this.value}"
                @filterChange="${e => this.onFilterChange(e.detail.value)}">
            </select-token-filter>
        `;
    }

    getDefaultConfig() {
        return {
            limit: 10,
            placeholder: this.RESOURCES[this.resource].placeholder,
            searchField: this.searchField || this.RESOURCES[this.resource].searchField,
            fields: this.RESOURCES[this.resource].fields,
            source: (params, success, failure) => {
                const page = params?.data?.page || 1;
                const attr = params?.data?.term ? {[this.searchField || this.RESOURCES[this.resource].searchField]: "~/" + params?.data?.term + "/i"} : null;
                const filters = {
                    study: this.opencgaSession.study.fqn,
                    limit: this._config.limit,
                    count: false,
                    skip: (page - 1) * this._config.limit,
                    ...this.query || this.RESOURCES[this.resource].query,
                    ...attr,
                };

                this.RESOURCES[this.resource].client.search(filters)
                    .then(response => success(response))
                    .catch(error => failure(error));

            },
            preprocessResults(results) {
                // if results come with null, emtpy or undefined it'll removed.
                let resultsCleaned = results.filter(r => r);
                if (this.searchField && this.searchField !== "id") {
                    resultsCleaned = resultsCleaned.map(item => {
                        item["id"] = item[this.searchField];
                        return item;
                    });
                }
                if (resultsCleaned.length) {
                    if ("string" === typeof resultsCleaned[0]) {
                        return resultsCleaned.map(s => ({id: s}));
                    }
                }
                return resultsCleaned;
            }
        };
    }

}

customElements.define("catalog-search-autocomplete", CatalogSearchAutocomplete);
