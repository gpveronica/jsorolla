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

import {LitElement, html} from "/web_modules/lit-element.js";
import UtilsNew from "./../../../../utilsNew.js";


export default class OpencgaFamilyView extends LitElement {

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
            opencgaClient: {
                type: Object
            },
            familyId: {
                type: String
            },
            family: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "osv" + UtilsNew.randomString(6);
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }


    firstUpdated(_changedProperties) {
    }

    updated(changedProperties) {
        if (changedProperties.has("familyId")) {
            this.familyIdObserver();
        }
        if (changedProperties.has("family")) {
            this.familyObserver();
        }
        if (changedProperties.has("config")) {
            this.configObserver();
        }
    }

    configObserver() {
    }

    // TODO recheck
    familyIdObserver() {
        console.warn("familyIdObserver");
        if (this.file !== undefined && this.file !== "") {
            this.opencgaSession.opencgaClient.family().info(this.familyId, {})
                .then( response => {
                    if (response.response[0].id === undefined) {
                        response.response[0].id = response.response[0].name;
                    }
                    this.family = response.response[0].result[0];
                    console.log("_this.individual", this.family);
                    this.requestUpdate();
                })
                .catch(function(reason) {
                    console.error(reason);
                });
        }

    }

    familyObserver() {
        console.log("familyObserver");

    }

    getDefaultConfig() {
        return {
            showTitle: false
        };
    }

    render() {
        return html`
        <style>
            .section-title {
                border-bottom: 2px solid #eee;
            }
            .label-title {
                text-align: left;
                padding-left: 5px;
                padding-right: 10px;
            }
        </style>

        ${this.family ? html`
        <div class="">
            ${this._config.showTitle ? html`<h3 class="section-title">Summary</h3>` : null}
            <div class="col-md-12">
                <div class="form-horizontal">
                    <div class="form-group">
                        <label class="col-md-3 label-title">Family Id</label>
                        <span class="col-md-9">${this.family.id}</span>
                    </div>
                    <div class="form-group">
                        <label class="col-md-3 label-title">Creation Date</label>
                        <span class="col-md-9">${UtilsNew.dateFormatter(this.family.creationDate)}</span>
                    </div>
                    ${this.family.disorders ? html`<div class="form-group">
                        <label class="col-md-3 label-title">Disorders</label>
                        <span class="col-md-9">${this.family.disorders.map( disorder => html`<p>${disorder.name} (${disorder.id})</p>`)}</span>
                    </div>                    
                    ` : null}
                    ${this.family.phenotypes ? html`
                        <div class="form-group">
                            <label class="col-md-3 label-title">Phenotypes</label>
                            <span class="col-md-9">${this.family.phenotypes.map( phenotype => html`<p>${phenotype.name} (${phenotype.id})</p>`)}</span>
                        </div>
                    ` : null}
                </div>
            </div>
        </div>
        ` : null }
        `;
    }

}

customElements.define("opencga-family-view", OpencgaFamilyView);

