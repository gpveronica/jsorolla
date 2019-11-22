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
import "./cellbase-variant-annotation-summary.js";
import "../cellbase-annotation-consequencetype-grid.js";
import "../cellbase-population-frequency-grid.js";

export default class CellbaseVariantAnnotationView extends LitElement {

    constructor() {
        super();
        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            cellbaseClient: {
                type: Object
            },
            data: {
                type: String,
                value: ""
            },
            assembly: {
                type: String
            },
            variantAnnotation: {
                type: Object
            },
            consequenceTypes: {
                type: Object
            },
            proteinSubstitutionScores: {
                type: Object
            },
            mode: {
                type: String
            },
            hashFragmentCredentials: {
                type: Object
            },
            prefix: {
                type: String
            }
        };
    }

    _init() {
        window.icons = {
            refresh: "fa-refresh",
            columns: "fa-th",
            paginationSwitchDown: "fa-caret-square-o-down",
            paginationSwitchUp: "fa-caret-square-o-up"
        };
        this.data = "";
        this.mode = "horizontal";
        this.assembly = "GRCh37";

        //TODO does it needs a prefix from the parent or not?
        if (typeof this._prefix === "undefined" || this._prefix === "") {
            this._prefix = "view" + Utils.randomString(6);
        }
    }

    updated(_changedProperties) {
        if(_changedProperties.has("data")) {
            this._variantChanged();
        }
    }

    attached() {
        if (this.mode === "vertical") {
            $("#" + this._prefix + "Div").addClass("col-xs-10");
        }
    }

    checkData(data) {
        return data !== "";
    }

    check(data) {
        return data.variantTraitAssociation !== null;
    }

    checkVertical(mode) {
        return this.mode === "vertical";
    }

    checkHorizontal(mode) {
        return this.mode === "horizontal";
    }

    checkClinvar(clinvar) {
        return typeof clinvar !== "undefined" && clinvar.length > 0;
    }

    checkCosmic(cosmic) {
        return typeof cosmic !== "undefined" && cosmic.length > 0;
    }

    _variantChanged() {
        let _this = this;
        if (typeof this.cellbaseClient !== "undefined" && UtilsNew.isNotEmpty(this.data) && !this.data.includes(" ")) {
            this.cellbaseClient.get("genomic", "variant", this.data, "annotation", {assembly: this.assembly}, {})
                .then(function(response) {
                    _this.variantAnnotation = response.response[0].result[0];
                    _this.numberConsequenceTypes = 0;
                    _this.numberPopulationFrequencies = 0;
                    _this.numberVTA = 0;
                    _this.numberGTA = 0;

                    if (_this.variantAnnotation.geneTraitAssociation != null) {
                        _this.numberConsequenceTypes = _this.variantAnnotation.consequenceTypes.length;
                        _this.numberPopulationFrequencies = UtilsNew.isNotEmptyArray(_this.variantAnnotation.populationFrequencies) ? _this.variantAnnotation.populationFrequencies.length : 0;
                        _this.numberVTA = UtilsNew.isNotUndefinedOrNull(_this.variantAnnotation.traitAssociation) ? _this.variantAnnotation.traitAssociation.length : 0;
                        _this.numberGTA = UtilsNew.isNotUndefinedOrNull(_this.variantAnnotation.geneTraitAssociation) ? _this.variantAnnotation.geneTraitAssociation.length : 0;
                    }

                    // Gene Trait Association definition
                    $("#" + _this._prefix + "GTATable").bootstrapTable("destroy");
                    $("#" + _this._prefix + "GTATable").bootstrapTable({
                        data: _this.variantAnnotation.geneTraitAssociation,
                        columns: [
                            [
                                {
                                    title: "id",
                                    field: "id"
                                },
                                {
                                    title: "name",
                                    field: "name"
                                },
                                {
                                    title: "hpo",
                                    field: "hpo"
                                },
                                {
                                    title: "source",
                                    field: "source"
                                }
                            ]
                        ]
                    });
                });
        }
    }

    render() {
        return html`

        <style include="jso-styles"></style>

        ${this.checkData(this.data) ? html`
            <div><h3>Please click on a variant to view annotations</h3></div>
        ` : html`
            <div style="padding-top: 20px;padding-left: 20px">
        
            <!-- This renders a vertical menu, this is controlled by the mode property -->
            ${this.checkVertical(this.mode) ? html`
                <div class="col-xs-2">
                    <ul id="stackedPills" class="nav nav-pills nav-stacked" role="tablist">
                        <li role="presentation" class="active"><a href="#${this._prefix}VariantAnnotationSummary" role="tab"
                                                                  data-toggle="tab">Summary</a></li>
                        <li role="presentation"><a href="#${this._prefix}VariantAnnotationConsequenceTypes" role="tab"
                                                   data-toggle="tab">Consequence Types (${this.numberConsequenceTypes})</a></li>
                        <li role="presentation"><a href="#${this._prefix}VariantAnnotationPopulationFrequencies" role="tab"
                                                   data-toggle="tab">Population Frequencies
                            (${this.numberPopulationFrequencies})</a></li>
                        <li role="presentation"><a href="#${this._prefix}VariantAnnotationVTA" role="tab" data-toggle="tab">Variant
                            Trait Association (${this.numberVTA})</a></li>
                        <li role="presentation"><a href="#${this._prefix}VariantAnnotationGTA" role="tab" data-toggle="tab">Gene
                            Trait Association (${this.numberGTA})</a></li>
                    </ul>
                </div>` : null}
        
            <!-- This renders a horizontal menu, this is controlled by the mode property -->
            ${this.checkHorizontal(this.mode) ? html`
                <ul id="myTabs" class="nav nav-tabs" role="tablist">
                    <li role="presentation" class="active"><a href="#${this._prefix}VariantAnnotationSummary" role="tab"
                                                              data-toggle="tab">Summary</a></li>
                    <li role="presentation"><a href="#${this._prefix}VariantAnnotationConsequenceTypes" role="tab" data-toggle="tab">Consequence
                        Types (${this.numberConsequenceTypes})</a></li>
                    <li role="presentation"><a href="#${this._prefix}VariantAnnotationPopulationFrequencies" role="tab"
                                               data-toggle="tab">Population Frequencies (${this.numberPopulationFrequencies})</a>
                    </li>
                    <li role="presentation"><a href="#${this._prefix}VariantAnnotationVTA" role="tab" data-toggle="tab">Variant Trait
                        Association (${this.numberVTA})</a></li>
                    <li role="presentation"><a href="#${this._prefix}VariantAnnotationGTA" role="tab" data-toggle="tab">Gene Trait
                        Association (${this.numberGTA})</a></li>
                </ul>
                ` : null}

    <div id="${this._prefix}Div" class="col-xs-10">
        <div class="tab-content">
            <!--Summary Tab-->
            <div role="tabpanel" class="tab-pane active" id="${this._prefix}VariantAnnotationSummary">
                <br>
                <cellbase-variant-annotation-summary .data="${this.variantAnnotation}"
                                                     .consequenceTypes="${this.consequenceTypes}"
                                                     .proteinSubstitutionScores="${this.proteinSubstitutionScores}">
                </cellbase-variant-annotation-summary>
            </div>
            <!--Consequence types Tab-->
            <div role="tabpanel" class="tab-pane" id="${this._prefix}VariantAnnotationConsequenceTypes">
                <cellbase-annotation-consequencetype-grid .data="${this.variantAnnotation.consequenceTypes}"
                                                          .prefix="${this._prefix}annotationView"
                                                          .hashFragmentCredentials="${this.hashFragmentCredentials}"
                                                          .consequenceTypes="${this.consequenceTypes}">
                </cellbase-annotation-consequencetype-grid>
            </div>
            <!--Population frequency Tab-->
            <div role="tabpanel" class="tab-pane" id="${this._prefix}VariantAnnotationPopulationFrequencies">
                <cellbase-population-frequency-grid .data="${this.variantAnnotation.populationFrequencies}"
                                                    .prefix="${this._prefix}annotationView">
                </cellbase-population-frequency-grid>
            </div>
            <!--Gene Trait Association Tab-->
            <div role="tabpanel" class="tab-pane" id="${this._prefix}VariantAnnotationGTA">
                <table id="${this._prefix}GTATable" data-search="true" data-show-columns="true" data-pagination="true"
                       data-page-list="[10, 25, 50]"
                       data-show-pagination-switch="true" data-show-export="true" data-icons-prefix="fa"
                       data-icons="icons">
                    <thead style="background-color: #eee"></thead>
                </table>
            </div>
            <!--Variant Trait Association-->
            <div role="tabpanel" class="tab-pane" id="${this._prefix}VariantAnnotationVTA">
                ${this.check(this.variantAnnotation) ? html`
                    <h4>Clinvar</h4>
                    ${this.checkClinvar(this.variantAnnotation.variantTraitAssociation.clinvar) ? html`
                    <div>
                        <table class="table table-hover table-bordered">
                            <thead style="background-color: #eee">
                            <tr>
                                <th>Accession</th>
                                <th>Clinical Significance</th>
                                <th>Traits</th>
                                <th>Gene Names</th>
                                <th>Review Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            ${this.variantAnnotation.variantTraitAssociation.clinvar.map(item => html`
                                <tr>
                                    <td>${item.accession}</td>
                                    <td>${item.clinicalSignificance}</td>
                                    <td>
                                        ${item.traits.map(trait => html`${trait}<br>`)}
                                    </td>
                                    <td>
                                        ${item.geneNames.map(geneName => html`${geneName}<br>`)}
                                    </td>
                                    <td>${item.reviewStatus}</td>
                                </tr>
                            `)}
                            </tbody>
                        </table>
                    </div>` : html`
                        <div>No ClinVar data available</div>
                    `}
                    
                    
                    <h4>Cosmic</h4>
                    ${this.checkCosmic(this.variantAnnotation.variantTraitAssociation.cosmic) ? html`
                        <table class="table table-hover table-bordered">
                            <thead style="background-color: #eee">
                            <tr>
                                <th>Mutation Id</th>
                                <th>Primary Site</th>
                                <th>Site Subtype</th>
                                <th>Primary Histology</th>
                                <th>Histology Subtype</th>
                                <th>Sample Source</th>
                                <th>Tumour Origin</th>
                                <th>Gene Name</th>
                                <th>Mutation Somatic Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            ${this.variantAnnotation.variantTraitAssociation.cosmic.map( item => html`
                                <tr>
                                    <td>${item.mutationId}</td>
                                    <td>${item.primarySite}</td>
                                    <td>${item.siteSubtype}</td>
                                    <td>${item.primaryHistology}</td>
                                    <td>${item.histologySubtype}</td>
                                    <td>${item.sampleSource}</td>
                                    <td>${item.tumourOrigin}</td>
                                    <td>${item.geneName}</td>
                                    <td>${item.mutationSomaticStatus}</td>
                                </tr>
                            `)}
                            </tbody>
                        </table>
                    ` : html`
                        No Cosmic data available
                    `}
                ` : html`No ClinVar and Cosmic data available`}
                
            </div>
        </div>
    </div>
</div>
        `}
        
        `;
    }
}

customElements.define("cellbase-variantannotation-view", CellbaseVariantAnnotationView);
