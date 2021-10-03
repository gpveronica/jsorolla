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
import UtilsNew from "../../../core/utilsNew.js";
import "../variant-modal-ontology.js";
import "./accessions-autocomplete-filter.js";
import {NotificationQueue} from "../../../core/NotificationQueue";


export default class HpoAccessionsFilter extends LitElement {

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
            "annot-hpo": {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "hpof-" + UtilsNew.randomString(6) + "_";
        this._selectedTermsArr = [];
        this.ontologyTerm = "HPO";
        this.ontologyFilter = "hp";
        this._config = {...this.getDefaultConfig(), ...this.config};
        this.operator = ","; // or = , and = ;
    }

    update(_changedProperties) {
        if (_changedProperties.has("annot-hpo")) {
            if (this["annot-hpo"]) {
                // parse operator
                if (this["annot-hpo"].split(",").length > 2) {
                    let operator;
                    const or = this["annot-hpo"].split(",");
                    const and = this["annot-hpo"].split(";");
                    if (or.length >= and.length) {
                        operator = ",";
                    } else {
                        operator = ";";
                    }
                    this.operator = operator;
                    this.selectedTerms = this["annot-hpo"];
                    this._selectedTermsArr = this["annot-hpo"].split(operator);
                } else {
                    // disable radio buttons if there are less than 2 values
                    // $("input:radio").attr("disabled", true);
                    this.operator = null;
                }
            } else {
                this.selectedTerms = null;
                // this.querySelector("#" + this._prefix + "HumanPhenotypeOntologyTextarea").value = "";
                // $("input:radio").attr("disabled", true);
                this.operator = null;
            }
        }
        super.update(_changedProperties);
    }

    onFilterChange(e) {
        // TODO FIX operator AND/OR
        console.log("filterChange", e || null);
        let terms = e.detail?.value;
        this.warnMessage = null;
        if (terms) {
            let arr = terms.split(/[;,]/);
            if (arr.length > 100) {
                console.log("more than 100 terms");
                this.warnMessage = html`<i class="fa fa-exclamation-triangle fa-2x"></i><span></span>`;
                new NotificationQueue().push("Warning", `${arr.length} has been selected. Only the first 100 will be taken into account.`, "warning");
                arr = arr.slice(0, 99);
                terms = arr.join(",");
            }
            this._selectedTermsArr = arr;
        }

        this.selectedTerms = terms;
        this.requestUpdate();

        const event = new CustomEvent("filterChange", {
            detail: {
                value: terms ?? null
            }
        });
        this.dispatchEvent(event);
    }

    openModal(e) {
        $("#hp_ontologyModal").modal("show");
    }

    getDefaultConfig() {
        return {
            ontologyFilter: "hp",
            placeholder: "HP:0000001, HP:3000079",
            ebiConfig: {
                root: "https://www.ebi.ac.uk/ols/api",
                tree: {
                    "hp": ["/ontologies/hp/terms/http%253A%252F%252Fpurl.obolibrary.org%252Fobo%252FHP_0012823",
                        "/ontologies/hp/terms/http%253A%252F%252Fpurl.obolibrary.org%252Fobo%252FHP_0040279",
                        "/ontologies/hp/terms/http%253A%252F%252Fpurl.obolibrary.org%252Fobo%252FHP_0000005",
                        "/ontologies/hp/terms/http%253A%252F%252Fpurl.obolibrary.org%252Fobo%252FHP_0040006",
                        "/ontologies/hp/terms/http%253A%252F%252Fpurl.obolibrary.org%252Fobo%252FHP_0000118",
                        /* "/ontologies/hp/terms/http%253A%252F%252Fpurl.obolibrary.org%252Fobo%252FUPHENO_0001002"*/],
                    "go": ["/ontologies/go/terms/http%253A%252F%252Fpurl.obolibrary.org%252Fobo%252FGO_0008150",
                        "/ontologies/go/terms/http%253A%252F%252Fpurl.obolibrary.org%252Fobo%252FGO_0005575",
                        "/ontologies/go/terms/http%253A%252F%252Fpurl.obolibrary.org%252Fobo%252FGO_0003674"],
                },
                search: "/search",
            }
        };
    }

    render() {
        return html`

            <accessions-autocomplete-filter .value="${this.selectedTerms}" .config="${this._config}" @filterChange="${this.onFilterChange}"></accessions-autocomplete-filter>

            <button class="btn btn-primary ripple full-width" id="${this._prefix}buttonOpenHpoAccesions" @click="${this.openModal}">
                <i class="fa fa-search searchingButton" aria-hidden="true"></i>
                Browse HPO Terms
            </button>

            <fieldset class="switch-toggle-wrapper">
                    <label style="font-weight: normal;">Logical Operator</label>
                    <div class="switch-toggle text-white alert alert-light">
                        <input id="${this._prefix}hpoOrRadio" name="hpoRadio" type="radio" value="or"
                                   class="radio-or" ?checked="${this.operator === ","}" ?disabled="${this._selectedTermsArr.length < 2}"
                                   @change="${this.changeOperator}">
                            <label for="${this._prefix}hpoOrRadio"
                                   class="rating-label rating-label-or">OR</label>
                        <input id="${this._prefix}hpoAndRadio" name="hpoRadio" type="radio" value="and"
                                   class="radio-and" ?checked="${this.operator === ";"}" ?disabled="${this._selectedTermsArr.length < 2}" @change="${this.changeOperator}">
                            <label for="${this._prefix}hpoAndRadio"
                                   class="rating-label rating-label-and">AND</label>
                        <a class="btn btn-primary ripple btn-small"></a>
                    </div>
            </fieldset>

            this._selectedTermsArr ${JSON.stringify(this._selectedTermsArr)}
            <variant-modal-ontology term="HPO"
                                    .config="${this._config}"
                                    .selectedTerms="${this.selectedTerms}"
                                    @filterChange="${this.onFilterChange}">
            </variant-modal-ontology>
        `;
    }

}

customElements.define("hpo-accessions-filter", HpoAccessionsFilter);
