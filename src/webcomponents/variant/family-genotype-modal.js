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
import "./family-genotype-filter.js";


export default class FamilyGenotypeModal extends LitElement {

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
            clinicalAnalysis: {
                type: Object
            },
            genotype: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "sgf-" + UtilsNew.randomString(6) + "_";
        this.errorState = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this._config = {...this.getDefaultConfig(), ...this.config};
    }

    updated(changedProperties) {
    }

    showModal() {
        $("#" + this._prefix + "SampleGenotypeFilterModal").modal("show");
    }

    // forward the event and handle error state
    onFilterChange(e) {
        this._genotype = e.detail.value;
        this.errorState = e.detail.errorState;
        console.log("onFilterChange", this._genotype);
        this.requestUpdate();
    }

    confirm() {
        this.dispatchEvent(new CustomEvent("filterChange", {
            detail: {
                value: this._genotype
            }
        }));
    }

    getDefaultConfig() {
        return {
            text: "Select sample genotype filter (e.g recessive, compound heterozygous, ...):"
        };
    }

    render() {
        // Check Project exists
        if (!this.clinicalAnalysis) {
            return html`
                <div class="guard-page">
                    <i class="fas fa-lock fa-5x"></i>
                    <h3>No Clinical Analysis selected.</h3>
                </div>
            `;
        }

        return html`
            <div>
                ${this._config.text ? html`<div style="padding: 5px 0px">${this._config.text}</div>` : null}
                <div class="text-center">
                    <button type="button" class="btn btn-default multi-line" @click="${this.showModal}">
                        Sample Genotype Filter ...
                    </button>
                </div>
            </div>

            <div class="modal fade" id="${this._prefix}SampleGenotypeFilterModal" data-backdrop="static" data-keyboard="false"
                 tabindex="-1" role="dialog" aria-hidden="true" style="padding-top: 0%; overflow-y: visible">
                <div class="modal-dialog" style="width: 1280px">
                    <div class="modal-content">
                        <div class="modal-header" style="padding: 5px 15px">
                            <h3>Sample Genotypes Filter</h3>
                        </div>
                        <div class="modal-body">
                            <family-genotype-filter .opencgaSession="${this.opencgaSession}"
                                                    .clinicalAnalysis="${this.clinicalAnalysis}"
                                                    .genotype="${this.genotype}"
                                                    @filterChange="${this.onFilterChange}">
                            </family-genotype-filter>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary ripple" data-dismiss="modal" .disabled=${this.errorState} @click="${this.confirm}">OK</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

}

customElements.define("family-genotype-modal", FamilyGenotypeModal);
