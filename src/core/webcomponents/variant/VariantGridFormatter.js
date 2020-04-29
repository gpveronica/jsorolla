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

import Utils from "../../utils.js";
import UtilsNew from "../../utilsNew.js";
import {consequenceTypes as CT} from "../commons/opencga-variant-contants.js";

//TODO urgent review of the whole class

export default class VariantGridFormatter {

    constructor(opencgaSession, config) {
        this.opencgaSession = opencgaSession;
        this.config = config;

        this.prefix = "VarBrowserGrid-" + Utils.randomString(6);
    }

    assignColors(consequenceTypes, proteinSubstitutionScores) {
        let result = {};
        if (typeof consequenceTypes !== "undefined") {
            let consequenceTypeToColor = {};
            let consequenceTypeToImpact = {};
            for (let i = 0; i < consequenceTypes.categories.length; i++) {
                if (typeof consequenceTypes.categories[i].terms !== "undefined") {
                    for (let j = 0; j < consequenceTypes.categories[i].terms.length; j++) {
                        consequenceTypeToColor[consequenceTypes.categories[i].terms[j].name] = CT.style[consequenceTypes.categories[i].terms[j].impact];
                        consequenceTypeToImpact[consequenceTypes.categories[i].terms[j].name] = consequenceTypes.categories[i].terms[j].impact;
                    }
                } else if (typeof consequenceTypes.categories[i].id !== "undefined" && typeof consequenceTypes.categories[i].name !== "undefined") {
                    consequenceTypeToColor[consequenceTypes.categories[i].name] = consequenceTypes[consequenceTypes.categories[i].impact];
                    consequenceTypeToImpact[consequenceTypes.categories[i].name] = consequenceTypes.categories[i].impact;
                }
            }
            // this.consequenceTypeToColor = consequenceTypeToColor;
            // this.consequenceTypeToImpact = consequenceTypeToImpact;
            result = {
                consequenceTypeToColor: consequenceTypeToColor,
                consequenceTypeToImpact: consequenceTypeToImpact
            }
        }

        if (typeof proteinSubstitutionScores !== "undefined") {
            let pssColor = new Map();
            for (let i in proteinSubstitutionScores) {
                let obj = proteinSubstitutionScores[i];
                Object.keys(obj).forEach(key => {
                    pssColor.set(key, obj[key]);
                });
            }
            // this.pssColor = pssColor;
            result.pssColor = pssColor;
        }

        return result;
    }

    variantFormatter(value, row, config) {
        if (row === undefined) {
            return;
        }

        // If REF/ALT is greater than maxAlleleLength we display the first and last 5 bp
        let ref = (UtilsNew.isNotEmpty(row.reference)) ? row.reference : "-";
        let alt = (UtilsNew.isNotEmpty(row.alternate)) ? row.alternate : "-";
        let maxAlleleLength = 15;
        if (UtilsNew.isNotUndefinedOrNull(config) && UtilsNew.isNotUndefinedOrNull(config.alleleStringLengthMax)) {
            maxAlleleLength = config.alleleStringLengthMax;
        }
        ref = (ref.length > maxAlleleLength) ? ref.substring(0, 5) + "..." + ref.substring(ref.length - 5) : ref;
        alt = (alt.length > maxAlleleLength) ? alt.substring(0, 5) + "..." + alt.substring(alt.length - 5) : alt;

        let id = row.id;
        if (UtilsNew.isEmpty(id)) {
            console.warn("row.id is empty: " + row);
            id = `${row.chromosome}:${row.start}:${ref}:${alt}`;
        }

        if (typeof row.annotation !== "undefined" && UtilsNew.isNotEmptyArray(row.annotation.xrefs)) {
            row.annotation.xrefs.find(function (element) {
                if (element.source === "dbSNP") {
                    id = element.id;
                }
            });
        }

        let genomeBrowserMenuLink = "";
        if (UtilsNew.isNotUndefinedOrNull(config) && config.showGenomeBrowser) {
            genomeBrowserMenuLink = `<div>
                                        <a class="genome-browser-option" data-variant-position="${row.chromosome}:${row.start}-${row.end}" style="cursor: pointer">
                                            <i class="fa fa-list" aria-hidden="true"></i> Genome Browser
                                        </a>
                                     </div>`;
        }

        let ensemblLinkHtml = id.startsWith("rs")
            ? "https://www.ensembl.org/Homo_sapiens/Variation/Explore?vdb=variation;v=" + id
            : "http://www.ensembl.org/Homo_sapiens/Location/View?r=" + row.chromosome + ":" + row.start + "-" + row.end;

        let snpLinkHtml = "";
        if (id.startsWith("rs")) {
            snpLinkHtml = `<div style="padding: 5px"><a target="_blank" href="https://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?searchType=adhoc_search&type=rs&rs=${id}">dbSNP</a></div>
                           <div style="padding: 5px"><a target="_blank" href="https://www.snpedia.com/index.php/${id}">SNPedia</a></div>
                           <div style="padding: 5px"><a target="_blank" href="https://www.ncbi.nlm.nih.gov/clinvar/?term=${id}">ClinVar</a></div>
                `;
        }

        // <div style="padding: 5px 15px; color: darkgray; font-weight: bolder">External Links</div>
        let tooltipText = `${genomeBrowserMenuLink}
                            <div style="padding: 5px">
                                <a target="_blank" href="${ensemblLinkHtml}">Ensembl</a>
                            </div>
                            ${snpLinkHtml}
                `;

        return `<div class="variant-tooltip" data-tooltip-text='${tooltipText}'>
                    <a style="cursor: pointer">
                        ${row.chromosome}:${row.start}&nbsp;&nbsp;${ref}/${alt}
                    </a>
                </div>`;
    }

    snpFormatter(value, row, index) {
        /*
            We try first to read SNP ID from the identifier of the variant (this identifier comes from the file).
            If this ID is not a "rs..." (it is a variant with the format: "13:20277279:-:T") then we search
            the rs in the CellBase XRef annotations. This field is in annotation.xref when source: "dbSNP".
        */
        if (typeof row.id !== "undefined" && row.id.startsWith("rs")) {
            if (this.opencgaSession.project.organism !== undefined && this.opencgaSession.project.organism.assembly === "GRCh37") {
                return "<a target='_blank' href='http://grch37.ensembl.org/Homo_sapiens/Variation/Explore?vdb=variation;v=" + row.id + "'>" + row.id + "</a>";
            } else {
                return "<a target='_blank' href='http://www.ensembl.org/Homo_sapiens/Variation/Explore?vdb=variation;v=" + row.id + "'>" + row.id + "</a>";
            }
        } else if (typeof row.annotation !== "undefined" && typeof row.annotation.xrefs !== "undefined" && row.annotation.xrefs.length > 0) {
            let annotation = row.annotation.xrefs.find(function (element) {
                return element.source === "dbSNP";
            });
            if (typeof annotation !== "undefined") {
                return "<a target='_blank' href='http://grch37.ensembl.org/Homo_sapiens/Variation/Explore?vdb=variation;v=" + annotation.id + "'>" + annotation.id + "</a>";
            }
        }
        return "-";
    }

    geneFormatter(value, row, index) {
        if (typeof row !== "undefined" && row.annotation !== undefined && UtilsNew.isNotEmptyArray(row.annotation.consequenceTypes)) {
            let visited = {};
            let geneLinks = [];
            for (let i = 0; i < row.annotation.consequenceTypes.length; i++) {
                let geneName = row.annotation.consequenceTypes[i].geneName;
                if (UtilsNew.isNotEmpty(geneName) && typeof visited[geneName] === "undefined") {
                    if (typeof this.opencgaSession.project !== "undefined" && typeof this.opencgaSession.study !== "undefined") {
                        let genomeBrowserMenuLink = "";
                        if (this.config.showGenomeBrowser) {
                            genomeBrowserMenuLink = `<div>
                                                        <a class="genome-browser-option" data-variant-position="${row.chromosome}:${row.start}-${row.end}" style="cursor: pointer">
                                                            Genome Browser
                                                        </a>
                                                     </div>`;
                        }

                        let tooltipText = `<div style="padding: 5px"><a style="cursor: pointer" href="#gene/${this.opencgaSession.project.alias}/${this.opencgaSession.study.alias}/${geneName}">Gene View</a></div>
                                            ${genomeBrowserMenuLink}
                                            <div class="dropdown-header" style="padding-left: 10px">External Links</div>
                                            <div style="padding: 5px"><a target="_blank" href="http://www.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=${geneName}">Ensembl</a></div>
                                            <div style="padding: 5px"><a target="_blank" href="https://cancer.sanger.ac.uk/cosmic/gene/analysis?ln=${geneName}">COSMIC</a></div>
                                            <div style="padding: 5px"><a target="_blank" href="https://www.uniprot.org/uniprot/?sort=score&query=${geneName}">UniProt</a></div>
                                        `;

                        geneLinks.push(`<span class="gene-tooltip" data-tooltip-text='${tooltipText}' style="margin-left: 2px">
                                            <a style="cursor: pointer">
                                                ${geneName}
                                            </a>
                                        </span>`);

                    } else {
                        geneLinks.push(`<a style="cursor: pointer">${geneName}</a>`)
                    }
                    visited[geneName] = true;
                }
            }

            // Do not write more than 4 genes per line, this could be easily configurable
            let resultHtml = "";
            for (let i = 0; i < geneLinks.length; i++) {
                resultHtml += geneLinks[i];
                if (i + 1 !== geneLinks.length) {
                    if (i === 0) {
                        resultHtml += ",";
                    } else if ((i + 1) % 2 !== 0) {
                        resultHtml += ",";
                    } else {
                        resultHtml += "<br>";
                    }
                }
            }

            return resultHtml;
        } else {
            return "-";
        }
    }

    typeFormatter(value, row, index) {
        if (row !== undefined) {
            let color = "";
            switch (row.type) {
                case "INDEL":
                case "MNV":
                    color = "darkorange";
                    break;
                case "INSERTION":
                case "DELETION":
                    color = "red";
                    break;
                default:
                    color = "black";
                    break;
            }

            return `<span style="color: ${color}">${row.type}</span>`;
        } else {
            return "-";
        }
    }

    consequenceTypeFormatter(value, row, index) {
        if (typeof row !== "undefined" && typeof row.annotation !== "undefined" && UtilsNew.isNotEmptyArray(row.annotation.consequenceTypes)) {
            let consequenceTypesArr = [];
            let visited = new Set();
            let impact = {};
            for (let i = 0; i < row.annotation.consequenceTypes.length; i++) {
                for (let j = 0; j < row.annotation.consequenceTypes[i].sequenceOntologyTerms.length; j++) {

                    let consequenceTypeName = row.annotation.consequenceTypes[i].sequenceOntologyTerms[j].name;

                    // FIXME This is a temporal fix for some wrong CTs. This must be removed ASAP.
                    if (consequenceTypeName === "2KB_downstream_gene_variant") {
                        consequenceTypeName = "2KB_downstream_variant";
                    }
                    if (consequenceTypeName === "2KB_upstream_gene_variant") {
                        consequenceTypeName = "2KB_upstream_variant";
                    }

                    if (typeof consequenceTypeName !== "undefined" && consequenceTypeName !== "" && !visited.has(consequenceTypeName)) {
                        if (typeof this.consequenceTypeToImpact !== "undefined"
                            && typeof this.consequenceTypeToImpact[consequenceTypeName] !== "undefined") {
                            let imp = this.consequenceTypeToImpact[consequenceTypeName];
                            if (typeof impact[imp] === "undefined") {
                                impact[imp] = [];
                            }
                            if (typeof this.consequenceTypeToColor !== "undefined"
                                && typeof this.consequenceTypeToColor[consequenceTypeName] !== "undefined") {
                                impact[imp].push("<span style=\"color: " + this.consequenceTypeToColor[consequenceTypeName] + "\">" + consequenceTypeName + "</span>");
                            } else {
                                impact[imp].push("<span>" + consequenceTypeName + "</span>");
                            }

                        }
                        visited.add(consequenceTypeName);
                    }
                }
            }

            if (Object.keys(impact).length > 0) {
                if (typeof impact["high"] !== "undefined" || typeof impact["moderate"] !== "undefined") {
                    if (typeof impact["high"] !== "undefined") {
                        Array.prototype.push.apply(consequenceTypesArr, impact["high"]);
                    }
                    if (typeof impact["moderate"] !== "undefined") {
                        Array.prototype.push.apply(consequenceTypesArr, impact["moderate"]);
                    }
                } else if (typeof impact["low"] !== "undefined") {
                    Array.prototype.push.apply(consequenceTypesArr, impact["low"]);
                } else if (typeof impact["modifier"] !== "undefined") {
                    Array.prototype.push.apply(consequenceTypesArr, impact["modifier"]);
                }
            }

            return consequenceTypesArr.join("<br>");
        }
        return "-";
    }

    consequenceTypeDetailFormatter(value, row, variantGrid) {
        if (typeof row !== "undefined" && typeof row.annotation !== "undefined" && UtilsNew.isNotEmptyArray(row.annotation.consequenceTypes)) {
            let ctHtml = `<table id="ConsqTypeTable" class="table table-hover table-no-bordered">
                                <thead>
                                    <tr>
                                        <th rowspan="2">Gene Name</th>
                                        <th rowspan="2">Ensembl Gene</th>                                     
                                        <th rowspan="2">Ensembl Transcript</th>
                                        <th rowspan="2">Biotype</th>
                                        <th rowspan="2">Transcript Flags</th>
                                        <th rowspan="2">Consequence Types (SO Term)</th>
                                        <th rowspan="1" colspan="3" style="text-align: center">Protein Variant Annotation</th>
                                    </tr>
                                    <tr>
                                        <th rowspan="1">UniProt Acc</th>
                                        <th rowspan="1">Position</th>
                                        <th rowspan="1">Ref/Alt</th>
                                    </tr>
                                </thead>
                                <tbody>`;

            // Sort and group CTs by Gene name
            row.annotation.consequenceTypes.sort(function(a, b) {
                if (a.geneName === "" && b.geneName !== "") {
                    return 1;
                }
                if (a.geneName !== "" && b.geneName === "") {
                    return -1;
                }
                if (a.geneName < b.geneName) {
                    return -1;
                }
                if (a.geneName > b.geneName) {
                    return 1;
                }
                return 0;
            });

            for (let ct of row.annotation.consequenceTypes) {
                // Prepare data info for columns
                let geneName = ct.geneName ? `<a href="https://www.genenames.org/tools/search/#!/all?query=${ct.geneName}" target="_blank">${ct.geneName}</a>` : "-";
                let geneId = ct.ensemblGeneId ? `<a href="http://www.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=${ct.ensemblGeneId}" target="_blank">${ct.ensemblGeneId}</a>` : "-";
                let transcriptId = ct.ensemblTranscriptId ? `<a href="http://www.ensembl.org/Homo_sapiens/Transcript/Idhistory?t=${ct.ensemblTranscriptId}" target="_blank">${ct.ensemblTranscriptId}</a>` : "-";

                let transcriptAnnotationFlags = "-";
                if (ct.ensemblTranscriptId) {
                    transcriptAnnotationFlags = ct.transcriptAnnotationFlags && ct.transcriptAnnotationFlags.length ? ct.transcriptAnnotationFlags.join(", ") : "NA";
                }

                let soArray = [];
                for (let so of ct.sequenceOntologyTerms) {
                    let color = "black";
                    if (typeof variantGrid.consequenceTypeToColor !== "undefined"
                        && typeof variantGrid.consequenceTypeToColor[so.name] !== "undefined") {
                        color = variantGrid.consequenceTypeToColor[so.name];
                    }
                    soArray.push(`<div style="color: ${color}">
                                    ${so.name} (<a href="http://www.sequenceontology.org/browser/current_svn/term/${so.accession}" target="_blank">${so.accession}</a>)
                                  </div>`);
                }

                let pva = ct.proteinVariantAnnotation ? ct.proteinVariantAnnotation : {};
                let uniprotAccession = pva.uniprotAccession ? `<a href="https://www.uniprot.org/uniprot/${pva.uniprotAccession}" target="_blank">${pva.uniprotAccession}</a>` : "-";

                // Create the table row
                ctHtml += `<tr class="detail-view-row">
                                <td>${geneName}</td>
                                <td>${geneId}</td>
                                <td>${transcriptId}</td>
                                <td>${UtilsNew.isNotEmpty(ct.biotype) ? ct.biotype : "-"}</td>
                                <td>${transcriptAnnotationFlags}</td>
                                <td>${soArray.join("")}</td>
                                <td>${uniprotAccession}</td>
                                <td>${pva.position !== undefined ? pva.position : "-"}</td>
                                <td>${pva.reference !== undefined ? pva.reference + "/" + pva.alternate : "-"}</td>
                           </tr>`;
            }
            ctHtml += "</tbody></table>";
            return ctHtml;
        }
        return "-";
    }


    addCohortStatsInfoTooltip(div, populationFrequencies) {
        $("#" + div).qtip({
            content: {
                title: "Population Frequencies",
                text: function(event, api) {
                    return `One coloured square is shown for each cohort. Frequencies are coded with colours which classify values 
                            into 'very rare', 'rare', 'average', 'common' or 'missing', see 
                            <a href="http://www.dialogues-cns.com/wp-content/uploads/2015/03/DialoguesClinNeurosci-17-69-g001.jpg" target="_blank">
                                http://www.dialogues-cns.com/wp-content/uploads/2015/03/DialoguesClinNeurosci-17-69-g001.jpg
                            </a>. Please, leave the cursor over each square to visualize the actual frequency values.
                            <div style="padding: 10px 0px 0px 0px"><label>Legend: </label></div>
                            <div><span><i class="fa fa-square" style="color: ${populationFrequencies.style.veryRare}" aria-hidden="true"></i> Very rare:  freq < 0.001</span></div>
                            <div><span><i class="fa fa-square" style="color: ${populationFrequencies.style.rare}" aria-hidden="true"></i> Rare:  freq < 0.005</span></div>
                            <div><span><i class="fa fa-square" style="color: ${populationFrequencies.style.average}" aria-hidden="true"></i> Average:  freq < 0.05</span></div>
                            <div><span><i class="fa fa-square" style="color: ${populationFrequencies.style.common}" aria-hidden="true"></i> Common:  freq >= 0.05</span></div>
                            <div><span><i class="fa fa-square" style="color: black" aria-hidden="true"></i> Not observed</span></div>`
                },
            },
            position: {
                target: "mouse",
                adjust: {
                    x: 2, y: 2,
                    mouse: false
                }
            },
            style: {
                width: "240px",
            },
            show: {
                delay: 200
            },
            hide: {
                fixed: true,
                // delay: 300
            }
        });
    }

    /**
     * Creates the colored table with one row and as many columns as populations.
     * @param cohorts
     * @param populationFrequenciesColor
     */
    createCohortStatsTable(cohorts, cohortStats, populationFrequenciesColor) {
        // This is used by the tooltip function below to display all population frequencies
        let popFreqsTooltip;
        let popFreqsArray = [];
        for (let cohort of cohorts) {
            let freq = (cohortStats.get(cohort.id) !== undefined) ? cohortStats.get(cohort.id) : 0;
            popFreqsArray.push(cohort.name + "::" + freq);
        }
        popFreqsTooltip = popFreqsArray.join(",");

        // Create the table (with the tooltip info)
        let tableSize = cohorts.length * 15;
        let htmlPopFreqTable = `<table style="width:${tableSize}px" class="cohortStatsTable" data-pop-freq="${popFreqsTooltip}"><tr>`;
        for (let cohort of cohorts) {
            let color = "black";
            if (typeof cohortStats.get(cohort.id) !== "undefined") {
                let freq = cohortStats.get(cohort.id);
                color = this._getPopulationFrequencyColor(freq, populationFrequenciesColor);
            }
            htmlPopFreqTable += `<td style="width: 15px; background: ${color}">&nbsp;</td>`;
        }
        htmlPopFreqTable += "</tr></table>";
        return htmlPopFreqTable;
    }


    addPopulationFrequenciesInfoTooltip(selector, populationFrequencies) {
        $(selector).qtip({
            content: {
                title: "Population Frequencies",
                text: function(event, api) {
                    return `One coloured square is shown for each population. Frequencies are coded with colours which classify values 
                            into 'very rare', 'rare', 'average', 'common' or 'missing', see 
                            <a href="https://www.nature.com/scitable/topicpage/multifactorial-inheritance-and-genetic-disease-919" target="_blank">
                                https://www.nature.com/scitable/topicpage/multifactorial-inheritance-and-genetic-disease-919
                            </a>. Please, leave the cursor over each square to display the actual frequency value.
                            <div style="padding: 10px 0px 0px 0px"><label>Legend: </label></div>
                            <div><span><i class="fa fa-square" style="color: ${populationFrequencies.style.veryRare}" aria-hidden="true"></i> Very rare:  freq < 0.001</span></div>
                            <div><span><i class="fa fa-square" style="color: ${populationFrequencies.style.rare}" aria-hidden="true"></i> Rare:  freq < 0.005</span></div>
                            <div><span><i class="fa fa-square" style="color: ${populationFrequencies.style.average}" aria-hidden="true"></i> Average:  freq < 0.05</span></div>
                            <div><span><i class="fa fa-square" style="color: ${populationFrequencies.style.common}" aria-hidden="true"></i> Common:  freq >= 0.05</span></div>
                            <div><span><i class="fa fa-square" style="color: black" aria-hidden="true"></i> Not observed</span></div>`
                },
            },
            position: {
                target: "mouse",
                adjust: {
                    x: 2, y: 2,
                    mouse: false
                }
            },
            style: {
                width: "240px",
            },
            show: {
                delay: 200
            },
            hide: {
                fixed: true,
                delay: 300
            }
        });
    }

    /**
     * Creates the colored table with one row and as many columns as populations.
     * @param populations
     * @param populationFrequenciesMap
     * @param populationFrequenciesColor
     */
    createPopulationFrequenciesTable(populations, populationFrequenciesMap, populationFrequenciesColor) {
        // This is used by the tooltip function below to display all population frequencies
        let popFreqsTooltip;
        let popFreqsArray = [];
        for (let population of populations) {
            let freq = (populationFrequenciesMap.get(population) !== undefined) ? populationFrequenciesMap.get(population) : 0;
            popFreqsArray.push(population + "::" + freq);
        }
        popFreqsTooltip = popFreqsArray.join(",");

        // Create the table (with the tooltip info)
        let tableSize = populations.length * 15;
        let htmlPopFreqTable = `<table style="width:${tableSize}px" class="populationFrequenciesTable" data-pop-freq="${popFreqsTooltip}"><tr>`;
        for (let population of populations) {
            // This array contains "study:population"
            let color = "black";
            if (typeof populationFrequenciesMap.get(population) !== "undefined") {
                let freq = populationFrequenciesMap.get(population);
                color = this._getPopulationFrequencyColor(freq, populationFrequenciesColor);
            }
            htmlPopFreqTable += `<td style="width: 15px; background: ${color}">&nbsp;</td>`;
        }
        htmlPopFreqTable += "</tr></table>";
        return htmlPopFreqTable;
    }

    addPopulationFrequenciesTooltip(div, populationFrequencies) {
        if (UtilsNew.isEmpty(div)) {
            div = "table.populationFrequenciesTable";
        }

        let _this = this;
        $(div).qtip({
            content: {
                title: "Population Frequencies",
                text: function (event, api) {
                    let popFreqs = $(this).attr('data-pop-freq').split(",");
                    let html = "";
                    for (let popFreq of popFreqs) {
                        let arr = popFreq.split("::");
                        let color = _this._getPopulationFrequencyColor(arr[1], populationFrequencies.style);
                        let freq = (arr[1] !== 0 && arr[1] !== "0") ? arr[1] : "0.00 (NA)";
                        html += `<div>
                                    <span><i class="fa fa-xs fa-square" style="color: ${color}" aria-hidden="true"></i>
                                        <label style="padding-left: 5px">${arr[0]}:</label>
                                    </span>
                                    <span style="font-weight: bold">${freq}</span>
                                </div>`;
                    }
                    return html;
                }
            },
            position: {
                target: "mouse",
                adjust: {
                    x: 2, y: 2,
                    mouse: false
                }
            },
            style: {
                width: "240px",
            },
            show: {
                delay: 200
            },
            hide: {
                fixed: true,
                delay: 300
            }
        });
    }

    _getPopulationFrequencyColor(freq, populationFrequenciesColor) {
        let color;
        if (freq === 0 || freq === "0") {
            color = populationFrequenciesColor.unobserved;
        } else if (freq < 0.001) {
            color = populationFrequenciesColor.veryRare;
        } else if (freq < 0.005) {
            color = populationFrequenciesColor.rare;
        } else if (freq < 0.05) {
            color = populationFrequenciesColor.average;
        } else {
            color = populationFrequenciesColor.common;
        }
        return color;
    }

    addPhenotypesInfoTooltip(div) {
        $("#" + div).qtip({
            content: {
                title: "Phenotypes",
                text: function(event, api) {
                    return `<div>
                                <span style="font-weight: bold">ClinVar</span> is a freely accessible, public archive of reports of the relationships among human variations 
                                and phenotypes, with supporting evidence.
                            </div>
                            <div style="padding-top: 10px">
                                <span style="font-weight: bold">COSMIC</span> is the world's largest and most comprehensive resource for exploring the impact of somatic mutations in human cancer.
                            </div>

                           `
                },
            },
            position: {
                target: "mouse",
                my: "top right",
                adjust: {
                    x: 2, y: 2,
                    mouse: false
                }
            },
            style: {
                width: "240px",
            },
            show: {
                delay: 200
            },
            hide: {
                fixed: true,
                delay: 300
            }
        });
    }

    /*
     * Reported Variant formatters
     */
    reportedEventDetailFormatter(value, row, variantGrid) {
        if (typeof row !== "undefined" && UtilsNew.isNotEmptyArray(row.evidences)) {

            let selectColumnHtml = "";
            if (variantGrid._config.showSelectCheckbox) {
                selectColumnHtml = "<th rowspan=\"2\">Select</th>";
            }

            let ctHtml = `<table id="ConsqTypeTable" class="table table-hover table-no-bordered">
                                <thead>
                                    <tr>
                                        <th rowspan="2">Gene</th>
                                        <th rowspan="2">Transcript</th>
                                        <th rowspan="2">Gencode</th>
                                        <th rowspan="2">Consequence Type (SO Term)</th>
                                        <th rowspan="2">Panel</th>
                                        <th rowspan="2">Mode of Inheritance</th>
                                        <th rowspan="2">Role in Cancer</th>
                                        <th rowspan="2">Actionable</th>
                                        <th rowspan="1" colspan="3" style="text-align: center">Classification</th>
                                        ${selectColumnHtml}
                                    </tr>
                                    <tr>
                                        <th rowspan="1">ACMG</th>
                                        <th rowspan="2">Tier</th>
                                        <th rowspan="1">Clinical Significance</th>
                                    </tr>
                                </thead>
                                <tbody>`;

            // Sort by Tier level
            row.evidences.sort(function(a, b) {
                if (a.tier === null || b.tier !== null) {
                    return 1;
                }
                if (a.tier !== null || b.tier === null) {
                    return -1;
                }
                if (a.tier < b.tier) {
                    return -1;
                }
                if (a.tier > b.tier) {
                    return 1;
                }
                return 0;
            });

            // FIXME Maybe this should happen in the server?
            // let biotypeSet = new Set();
            let consequenceTypeSet = new Set();
            if (UtilsNew.isNotUndefinedOrNull(variantGrid.query)) {
                // if (UtilsNew.isNotUndefinedOrNull(variantGrid.query.biotype)) {
                //     biotypeSet = new Set(variantGrid.query.biotype.split(","));
                // }
                if (UtilsNew.isNotUndefinedOrNull(variantGrid.query.ct)) {
                    consequenceTypeSet = new Set(variantGrid.query.ct.split(","));
                }
            }

            for (let re of row.evidences) {
                // FIXME Maybe this should happen in the server?
                // If ct exist and there are some consequenceTypeIds then we check that the report event matches the query
                if (UtilsNew.isNotEmptyArray(re.consequenceTypeIds) && consequenceTypeSet.size > 0) {
                    let hasConsequenceType = false;
                    for (let ct of re.consequenceTypeIds) {
                        if (consequenceTypeSet.has(ct)) {
                            hasConsequenceType = true;
                        }
                    }
                    if (!hasConsequenceType) {
                        continue;
                    }
                }

                // Prepare data info for columns
                let gene = "-";
                if (UtilsNew.isNotEmpty(re.genomicFeature.id)) {
                    gene = `<div>
                                <a href="https://www.genenames.org/tools/search/#!/all?query=${re.genomicFeature.geneName}" target="_blank">
                                    ${re.genomicFeature.geneName}
                                </a>
                            </div>
                            <div style="padding-top: 5px">
                                <a href="http://www.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=${re.genomicFeature.id}" target="_blank">
                                    ${re.genomicFeature.id}
                                </a>
                            </div>`;
                }



                let transcriptId = "-";
                if (UtilsNew.isNotEmpty(re.genomicFeature.transcriptId)) {
                    let biotype = "-";
                    if (UtilsNew.isNotUndefinedOrNull(row.annotation) && UtilsNew.isNotEmptyArray(row.annotation.consequenceTypes)) {
                        for (let ct of row.annotation.consequenceTypes) {
                            if (ct.ensemblTranscriptId === re.genomicFeature.transcriptId) {
                                biotype = ct.biotype;
                                break;
                            }
                        }
                    }

                    transcriptId = `<div>
                                        <a href="http://www.ensembl.org/Homo_sapiens/Transcript/Idhistory?t=${re.genomicFeature.transcriptId}" target="_blank">
                                            ${re.genomicFeature.transcriptId}
                                        </a>
                                    </div>
                                    <div style="padding-top: 5px">
                                        ${biotype}
                                    </div>`;
                }

                let transcriptFlag = "";
                let transcriptFlagChecked = false;
                if (UtilsNew.isNotEmptyArray(row.annotation.consequenceTypes)) {
                    for (let ct of row.annotation.consequenceTypes) {
                        if (re.genomicFeature.transcriptId === ct.ensemblTranscriptId) {
                            if (ct.transcriptAnnotationFlags !== undefined && ct.transcriptAnnotationFlags.includes("basic")) {
                                transcriptFlag = `<span data-toggle="tooltip" data-placement="bottom" title="Proband">
                                                    <i class='fa fa-check' style='color: green'></i>
                                                  </span>`;
                                transcriptFlagChecked = true;
                            } else {
                                if (re.genomicFeature.transcriptId) {
                                    transcriptFlag = `<span><i class='fa fa-times' style='color: red'></i></span>`;
                                } else {
                                    transcriptFlag = `-`;
                                }
                            }
                            break;
                        }
                    }
                }

                let soArray = [];
                if (UtilsNew.isNotEmptyArray(re.consequenceTypes)) {
                    for (let so of re.consequenceTypes) {
                        let color = "black";
                        if (typeof variantGrid.consequenceTypeToColor !== "undefined" && typeof variantGrid.consequenceTypeToColor[so.name] !== "undefined") {
                            color = variantGrid.consequenceTypeToColor[so.name];
                        }
                        soArray.push(`<div style="color: ${color}">
                                    ${so.name} (<a href="http://www.sequenceontology.org/browser/current_svn/term/${so.accession}" target="_blank">${so.accession}</a>)
                                  </div>`);
                    }
                }


                let panel = "-";
                if (UtilsNew.isNotUndefinedOrNull(re.panelId)) {
                    panel = re.panelId;
                }

                let moi = "-";
                if (UtilsNew.isNotUndefinedOrNull(re.modeOfInheritance)) {
                    moi = re.modeOfInheritance;
                }

                let roleInCancer = "-";
                if (UtilsNew.isNotUndefinedOrNull(re.roleInCancer)) {
                    roleInCancer = re.roleInCancer === "TUMOR_SUPRESSOR_GENE" || re.roleInCancer === "TUMOR_SUPPRESSOR_GENE" ? "TSG" : re.roleInCancer;
                    // roleInCancer = re.roleInCancer;
                }

                let actionable = "-";
                if (UtilsNew.isNotUndefinedOrNull(re.actionable) && re.actionable) {
                    actionable = "Yes";
                }

                let acmg = "-";
                if (UtilsNew.isNotEmptyArray(re.classification.acmg)) {
                    acmg = re.classification.acmg.join(", ");
                }

                let tier = "-";
                let color = "black";
                if (UtilsNew.isNotUndefinedOrNull(re.tier)) {
                    color = (re.tier === "Tier1" || re.tier === "Tier 1") ? "red" : color;
                    color = (re.tier === "Tier2" || re.tier === "Tier 2") ? "darkorange" : color;
                    color = (re.tier === "Tier3" || re.tier === "Tier 3") ? "blue" : color;
                    tier = `<span style="color: ${color}">${re.tier}</span>`;
                }

                let clinicalSignificance = "-";
                if (re.classification.clinicalSignificance) {
                    clinicalSignificance = re.classification.clinicalSignificance;
                    switch (clinicalSignificance) {
                        case "PATHOGENIC":
                        case "PATHOGENIC_VARIANT":
                        case "LIKELY_PATHOGENIC":
                        case "LIKELY_PATHOGENIC_VARIANT":
                            clinicalSignificance = `<span style='color: red'>${clinicalSignificance.replace("_", " ")}</span>`;
                            break;
                        case "UNCERTAIN_SIGNIFICANCE":
                        case "VARIANT_OF_UNKNOWN_CLINICAL_SIGNIFICANCE":
                            clinicalSignificance = `<span style='color: darkorange'>${clinicalSignificance.replace("_", " ")}</span>`;
                            break;
                        case "LIKELY_BENIGN":
                        case "LIKELY_BENIGN_VARIANT":
                        case "BENIGN":
                        case "BENIGN_VARIANT":
                            clinicalSignificance = `<span style='color: blue'>${clinicalSignificance.replace("_", " ")}</span>`;
                            break;
                        case "NOT_ASSESSED":
                            clinicalSignificance = `<span style='color: black'>${clinicalSignificance.replace("_", " ")}</span>`;
                            break;
                        default:
                            clinicalSignificance = "NA";
                            break;
                    }
                }

                let checboxHtml = "";
                if (variantGrid._config.showSelectCheckbox) {
                    let checked = "";
                    if (transcriptFlagChecked && tier !== "-") {
                        checked = "checked";
                    }
                    checboxHtml = `<td><input type="checkbox" ${checked}></td>`;
                }


                // Create the table row
                ctHtml += `<tr class="detail-view-row">
                            <td>${gene}</td>
                            <td>${transcriptId}</td>
                            <td>${transcriptFlag}</td>
                            <td>${soArray.join("")}</td>
                            <td>${panel}</td>
                            <td>${moi}</td>
                            <td>${roleInCancer}</td>
                            <td>${actionable}</td>
                            <td>${acmg}</td>
                            <td>${tier}</td>
                            <td>${clinicalSignificance}</td>
                            ${checboxHtml}
                           </tr>`;
            }
            ctHtml += "</tbody></table>";
            return ctHtml;
        }
        return "-";
    }


    addTooltip(selector, title, content, config) {
        $(selector).qtip({
            content: {
                title: title,
                text: function (event, api) {
                    if (UtilsNew.isNotEmpty(content)) {
                        return content;
                    } else {
                        return $(this).attr('data-tooltip-text');
                    }
                }
            },
            position: {
                target: "mouse",
                my: (config !== undefined && config.position !== undefined && config.position.my !== undefined) ? config.position.my : "top left",
                adjust: {
                    x: 2, y: 2,
                    mouse: false
                }
            },
            style: {
                classes: (config !== undefined && config.style !== undefined && config.style.classes !== undefined) ? config.style.classes : "qtip-light qtip-rounded qtip-shadow qtip-custom-class",
                width: "260px",
            },
            show: {
                delay: 250
            },
            hide: {
                fixed: true,
                delay: 300
            }
        });
    }

}
