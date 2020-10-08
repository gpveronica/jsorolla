/**
 * Copyright 2015-2020 OpenCB
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * WARNING: AUTOGENERATED CODE
 * 
 * This code was generated by a tool.
 * Autogenerated on: 2020-10-08 15:34:24
 * 
 * Manual changes to this file may cause unexpected behavior in your application.
 * Manual changes to this file will be overwritten if the code is regenerated. 
 *
**/

import OpenCGAParentClass from "./../opencga-parent-class.js";


/**
 * This class contains the methods for the "Clinical" resource
 */

export default class Clinical extends OpenCGAParentClass {

    constructor(config) {
        super(config);
    }

    /** Update the set of permissions granted for the member
    * @param {String} members - Comma separated list of user or group IDs.
    * @param {Object} data - JSON containing the parameters to add ACLs.
    * @param {String} action - Action to be performed [ADD, SET, REMOVE or RESET].
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {Boolean} [params.propagate = "false"] - Propagate permissions to related families, individuals, samples and files. The default
    *     value is false.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    updateAcl(members, action, data, params) {
        return this._post("analysis", null, "clinical/acl", members, "update", data, {action, ...params});
    }

    /** Create a new clinical analysis
    * @param {Object} data - JSON containing clinical analysis information.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {Boolean} [params.createDefaultInterpretation] - Flag to create and initialise a default primary interpretation (Id will be
    *     '{clinicalAnalysisId}.1').
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    create(data, params) {
        return this._post("analysis", null, "clinical", null, "create", data, params);
    }

    /** Clinical interpretation analysis
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.include] - Fields included in the response, whole JSON path must be provided.
    * @param {String} [params.exclude] - Fields excluded in the response, whole JSON path must be provided.
    * @param {Number} [params.limit] - Number of results to be returned.
    * @param {Number} [params.skip] - Number of results to skip.
    * @param {Boolean} [params.sort] - Sort the results.
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {String} [params.id] - Interpretation ID.
    * @param {String} [params.description] - Description.
    * @param {String} [params.software] - Software.
    * @param {String} [params.analyst] - Analyst.
    * @param {String} [params.comment] - Comments.
    * @param {String} [params.status] - Status.
    * @param {String} [params.creationDate] - Creation date.
    * @param {String} [params.version] - Version.
    * @param {String} [params.panel] - List of panels.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    searchInterpretation(params) {
        return this._get("analysis", null, "clinical/interpretation", null, "search", params);
    }

    /** Run cancer tiering interpretation analysis
    * @param {Object} data - Cancer tiering interpretation analysis params.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {String} [params.jobId] - Job ID. It must be a unique string within the study. An ID will be autogenerated automatically if not
    *     provided.
    * @param {String} [params.jobDescription] - Job description.
    * @param {String} [params.jobDependsOn] - Comma separated list of existing job IDs the job will depend on.
    * @param {String} [params.jobTags] - Job tags.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    runInterpreterCancerTiering(data, params) {
        return this._post("analysis", null, "clinical/interpreter/cancerTiering", null, "run", data, params);
    }

    /** Run TEAM interpretation analysis
    * @param {Object} data - TEAM interpretation analysis params.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {String} [params.jobId] - Job ID. It must be a unique string within the study. An ID will be autogenerated automatically if not
    *     provided.
    * @param {String} [params.jobDescription] - Job description.
    * @param {String} [params.jobDependsOn] - Comma separated list of existing job IDs the job will depend on.
    * @param {String} [params.jobTags] - Job tags.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    runInterpreterTeam(data, params) {
        return this._post("analysis", null, "clinical/interpreter/team", null, "run", data, params);
    }

    /** Run tiering interpretation analysis
    * @param {Object} data - Tiering interpretation analysis params.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {String} [params.jobId] - Job ID. It must be a unique string within the study. An ID will be autogenerated automatically if not
    *     provided.
    * @param {String} [params.jobDescription] - Job description.
    * @param {String} [params.jobDependsOn] - Comma separated list of existing job IDs the job will depend on.
    * @param {String} [params.jobTags] - Job tags.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    runInterpreterTiering(data, params) {
        return this._post("analysis", null, "clinical/interpreter/tiering", null, "run", data, params);
    }

    /** Run Zetta interpretation analysis
    * @param {Object} data - Zetta interpretation analysis params.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {String} [params.jobId] - Job ID. It must be a unique string within the study. An ID will be autogenerated automatically if not
    *     provided.
    * @param {String} [params.jobDescription] - Job description.
    * @param {String} [params.jobDependsOn] - Comma separated list of existing job IDs the job will depend on.
    * @param {String} [params.jobTags] - Job tags.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    runInterpreterZetta(data, params) {
        return this._post("analysis", null, "clinical/interpreter/zetta", null, "run", data, params);
    }

    /** Clinical analysis search.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.include] - Fields included in the response, whole JSON path must be provided.
    * @param {String} [params.exclude] - Fields excluded in the response, whole JSON path must be provided.
    * @param {Number} [params.limit] - Number of results to be returned.
    * @param {Number} [params.skip] - Number of results to skip.
    * @param {Boolean} [params.count = "false"] - Get the total number of results matching the query. Deactivated by default. The default
    *     value is false.
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {String} [params.id] - Clinical analysis ID.
    * @param {String} [params.type] - Clinical analysis type.
    * @param {String} [params.priority] - Priority.
    * @param {String} [params.creationDate] - Creation date. Format: yyyyMMddHHmmss. Examples: >2018, 2017-2018, <201805.
    * @param {String} [params.modificationDate] - Modification date. Format: yyyyMMddHHmmss. Examples: >2018, 2017-2018, <201805.
    * @param {String} [params.internalStatus] - Filter by internal status.
    * @param {String} [params.status] - Filter by status.
    * @param {String} [params.dueDate] - Due date (Format: yyyyMMddHHmmss. Examples: >2018, 2017-2018, <201805...).
    * @param {String} [params.description] - Description.
    * @param {String} [params.family] - Family id.
    * @param {String} [params.proband] - Proband id.
    * @param {String} [params.sample] - Sample id associated to the proband or any member of a family.
    * @param {String} [params.member] - Proband id or any member id of a family.
    * @param {String} [params.analystAssignee] - Clinical analyst assignee.
    * @param {String} [params.disorder] - Disorder ID or name.
    * @param {String} [params.flags] - Flags.
    * @param {Boolean} [params.deleted = "false"] - Boolean to retrieve deleted entries. The default value is false.
    * @param {String} [params.release] - Release value.
    * @param {String} [params.attributes] - Text attributes (Format: sex=male,age>20 ...).
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    search(params) {
        return this._get("analysis", null, "clinical", null, "search", params);
    }

    /** Fetch actionable clinical variants
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {String} [params.sample] - Sample ID.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    actionableVariant(params) {
        return this._get("analysis", null, "clinical/variant", null, "actionable", params);
    }

    /** Fetch clinical variants
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.include] - Fields included in the response, whole JSON path must be provided.
    * @param {String} [params.exclude] - Fields excluded in the response, whole JSON path must be provided.
    * @param {Number} [params.limit] - Number of results to be returned.
    * @param {Number} [params.skip] - Number of results to skip.
    * @param {Boolean} [params.count] - Get the total number of results matching the query. Deactivated by default.
    * @param {Boolean} [params.approximateCount] - Get an approximate count, instead of an exact total count. Reduces execution time.
    * @param {Number} [params.approximateCountSamplingSize] - Sampling size to get the approximate count. Larger values increase accuracy
    *     but also increase execution time.
    * @param {String} [params.savedFilter] - Use a saved filter at User level.
    * @param {String} [params.id] - List of IDs, these can be rs IDs (dbSNP) or variants in the format chrom:start:ref:alt, e.g.
    *     rs116600158,19:7177679:C:T.
    * @param {String} [params.region] - List of regions, these can be just a single chromosome name or regions in the format chr:start-end,
    *     e.g.: 2,3:100000-200000.
    * @param {String} [params.type] - List of types, accepted values are SNV, MNV, INDEL, SV, CNV, INSERTION, DELETION, e.g. SNV,INDEL.
    * @param {String} [params.study] - Filter variants from the given studies, these can be either the numeric ID or the alias with the
    *     format user@project:study.
    * @param {String} [params.file] - Filter variants from the files specified. This will set includeFile parameter when not provided.
    * @param {String} [params.filter] - Specify the FILTER for any of the files. If 'file' filter is provided, will match the file and the
    *     filter. e.g.: PASS,LowGQX.
    * @param {String} [params.qual] - Specify the QUAL for any of the files. If 'file' filter is provided, will match the file and the qual.
    *     e.g.: >123.4.
    * @param {String} [params.fileData] - Filter by file data (i.e. FILTER, QUAL and INFO columns from VCF file).
    *     [{file}:]{key}{op}{value}[,;]* . If no file is specified, will use all files from "file" filter. e.g. AN>200 or
    *     file_1.vcf:AN>200;file_2.vcf:AN<10 . Many fields can be combined. e.g. file_1.vcf:AN>200;DB=true;file_2.vcf:AN<10,FILTER=PASS,LowDP.
    * @param {String} [params.sample] - Filter variants by sample genotype. This will automatically set 'includeSample' parameter when not
    *     provided. This filter accepts multiple 3 forms: 1) List of samples: Samples that contain the main variant. Accepts AND (;) and OR (,)
    *     operators.  e.g. HG0097,HG0098 . 2) List of samples with genotypes: {sample}:{gt1},{gt2}. Accepts AND (;) and OR (,) operators.  e.g.
    *     HG0097:0/0;HG0098:0/1,1/1 . Unphased genotypes (e.g. 0/1, 1/1) will also include phased genotypes (e.g. 0|1, 1|0, 1|1), but not vice
    *     versa. When filtering by multi-allelic genotypes, any secondary allele will match, regardless of its position e.g. 1/2 will match with
    *     genotypes 1/2, 1/3, 1/4, .... Genotype aliases accepted: HOM_REF, HOM_ALT, HET, HET_REF, HET_ALT and MISS  e.g.
    *     HG0097:HOM_REF;HG0098:HET_REF,HOM_ALT . 3) Sample with segregation mode: {sample}:{segregation}. Only one sample accepted.Accepted
    *     segregation modes: [ autosomalDominant, autosomalRecessive, XLinkedDominant, XLinkedRecessive, YLinked, mitochondrial, deNovo,
    *     mendelianError, compoundHeterozygous ]. Value is case insensitive. e.g. HG0097:DeNovo Sample must have parents defined and indexed. .
    * @param {String} [params.sampleData] - Filter by any SampleData field from samples. [{sample}:]{key}{op}{value}[,;]* . If no sample is
    *     specified, will use all samples from "sample" or "genotype" filter. e.g. DP>200 or HG0097:DP>200,HG0098:DP<10 . Many FORMAT fields can
    *     be combined. e.g. HG0097:DP>200;GT=1/1,0/1,HG0098:DP<10.
    * @param {String} [params.sampleAnnotation] - Selects some samples using metadata information from Catalog. e.g.
    *     age>20;phenotype=hpo:123,hpo:456;name=smith.
    * @param {String} [params.cohort] - Select variants with calculated stats for the selected cohorts.
    * @param {String} [params.cohortStatsRef] - Reference Allele Frequency: [{study:}]{cohort}[<|>|<=|>=]{number}. e.g. ALL<=0.4.
    * @param {String} [params.cohortStatsAlt] - Alternate Allele Frequency: [{study:}]{cohort}[<|>|<=|>=]{number}. e.g. ALL<=0.4.
    * @param {String} [params.cohortStatsMaf] - Minor Allele Frequency: [{study:}]{cohort}[<|>|<=|>=]{number}. e.g. ALL<=0.4.
    * @param {String} [params.cohortStatsMgf] - Minor Genotype Frequency: [{study:}]{cohort}[<|>|<=|>=]{number}. e.g. ALL<=0.4.
    * @param {String} [params.cohortStatsPass] - Filter PASS frequency: [{study:}]{cohort}[<|>|<=|>=]{number}. e.g. ALL>0.8.
    * @param {String} [params.missingAlleles] - Number of missing alleles: [{study:}]{cohort}[<|>|<=|>=]{number}.
    * @param {String} [params.missingGenotypes] - Number of missing genotypes: [{study:}]{cohort}[<|>|<=|>=]{number}.
    * @param {String} [params.score] - Filter by variant score: [{study:}]{score}[<|>|<=|>=]{number}.
    * @param {String} [params.family] - Filter variants where any of the samples from the given family contains the variant (HET or
    *     HOM_ALT).
    * @param {String} [params.familyDisorder] - Specify the disorder to use for the family segregation.
    * @param {String} [params.familySegregation] - Filter by segregation mode from a given family. Accepted values: [ autosomalDominant,
    *     autosomalRecessive, XLinkedDominant, XLinkedRecessive, YLinked, mitochondrial, deNovo, mendelianError, compoundHeterozygous ].
    * @param {String} [params.familyMembers] - Sub set of the members of a given family.
    * @param {String} [params.familyProband] - Specify the proband child to use for the family segregation.
    * @param {String} [params.gene] - List of genes, most gene IDs are accepted (HGNC, Ensembl gene, ...). This is an alias to 'xref'
    *     parameter.
    * @param {String} [params.ct] - List of SO consequence types, e.g. missense_variant,stop_lost or SO:0001583,SO:0001578.
    * @param {String} [params.xref] - List of any external reference, these can be genes, proteins or variants. Accepted IDs include HGNC,
    *     Ensembl genes, dbSNP, ClinVar, HPO, Cosmic, ...
    * @param {String} [params.biotype] - List of biotypes, e.g. protein_coding.
    * @param {String} [params.proteinSubstitution] - Protein substitution scores include SIFT and PolyPhen. You can query using the score
    *     {protein_score}[<|>|<=|>=]{number} or the description {protein_score}[~=|=]{description} e.g. polyphen>0.1,sift=tolerant.
    * @param {String} [params.conservation] - Filter by conservation score: {conservation_score}[<|>|<=|>=]{number} e.g.
    *     phastCons>0.5,phylop<0.1,gerp>0.1.
    * @param {String} [params.populationFrequencyAlt] - Alternate Population Frequency: {study}:{population}[<|>|<=|>=]{number}. e.g.
    *     1kG_phase3:ALL<0.01.
    * @param {String} [params.populationFrequencyRef] - Reference Population Frequency: {study}:{population}[<|>|<=|>=]{number}. e.g.
    *     1kG_phase3:ALL<0.01.
    * @param {String} [params.populationFrequencyMaf] - Population minor allele frequency: {study}:{population}[<|>|<=|>=]{number}. e.g.
    *     1kG_phase3:ALL<0.01.
    * @param {String} [params.transcriptFlag] - List of transcript annotation flags. e.g. CCDS, basic, cds_end_NF, mRNA_end_NF,
    *     cds_start_NF, mRNA_start_NF, seleno.
    * @param {String} [params.geneTraitId] - List of gene trait association id. e.g. "umls:C0007222" , "OMIM:269600".
    * @param {String} [params.go] - List of GO (Gene Ontology) terms. e.g. "GO:0002020".
    * @param {String} [params.expression] - List of tissues of interest. e.g. "lung".
    * @param {String} [params.proteinKeyword] - List of Uniprot protein variant annotation keywords.
    * @param {String} [params.drug] - List of drug names.
    * @param {String} [params.functionalScore] - Functional score: {functional_score}[<|>|<=|>=]{number} e.g. cadd_scaled>5.2 ,
    *     cadd_raw<=0.3.
    * @param {String} [params.clinicalSignificance] - Clinical significance: benign, likely_benign, likely_pathogenic, pathogenic.
    * @param {String} [params.customAnnotation] - Custom annotation: {key}[<|>|<=|>=]{number} or {key}[~=|=]{text}.
    * @param {String} [params.panel] - Filter by genes from the given disease panel.
    * @param {String} [params.trait] - List of traits, based on ClinVar, HPO, COSMIC, i.e.: IDs, histologies, descriptions,...
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    queryVariant(params) {
        return this._get("analysis", null, "clinical/variant", null, "query", params);
    }

    /** Returns the acl of the clinical analyses. If member is provided, it will only return the acl for the member.
    * @param {String} clinicalAnalyses - Comma separated list of clinical analysis IDs or names up to a maximum of 100.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {String} [params.member] - User or group ID.
    * @param {Boolean} [params.silent = "false"] - Boolean to retrieve all possible entries that are queried for, false to raise an
    *     exception whenever one of the entries looked for cannot be shown for whichever reason. The default value is false.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    acl(clinicalAnalyses, params) {
        return this._get("analysis", null, "clinical", clinicalAnalyses, "acl", params);
    }

    /** Delete clinical analyses
    * @param {String} [clinicalAnalyses] - Comma separated list of clinical analysis IDs or names up to a maximum of 100.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    delete(clinicalAnalyses, params) {
        return this._delete("analysis", null, "clinical", clinicalAnalyses, "delete", params);
    }

    /** Update clinical analysis attributes
    * @param {String} [clinicalAnalyses] - Comma separated list of clinical analysis IDs.
    * @param {Object} data - JSON containing clinical analysis information.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {"ADD"|"REMOVE"} [params.commentsAction = "ADD"] - Action to be performed if the array of comments is being updated. The
    *     default value is ADD.
    * @param {"ADD"|"SET"|"REMOVE"} [params.flagsAction = "ADD"] - Action to be performed if the array of flags is being updated. The
    *     default value is ADD.
    * @param {"ADD"|"SET"|"REMOVE"} [params.filesAction = "ADD"] - Action to be performed if the array of files is being updated. The
    *     default value is ADD.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    update(clinicalAnalyses, data, params) {
        return this._post("analysis", null, "clinical", clinicalAnalyses, "update", data, params);
    }

    /** Clinical analysis info
    * @param {String} [clinicalAnalysis] - Comma separated list of clinical analysis IDs or names up to a maximum of 100.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.include] - Fields included in the response, whole JSON path must be provided.
    * @param {String} [params.exclude] - Fields excluded in the response, whole JSON path must be provided.
    * @param {String} [params.study] - Study [[user@]project:]study where study and project can be either the ID or UUID.
    * @param {Boolean} [params.deleted = "false"] - Boolean to retrieve deleted entries. The default value is false.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    info(clinicalAnalysis, params) {
        return this._get("analysis", null, "clinical", clinicalAnalysis, "info", params);
    }

    /** Clear the fields of the main interpretation of the Clinical Analysis
    * @param {String} [clinicalAnalysis] - Clinical analysis ID.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - [[user@]project:]study ID.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    clearInterpretation(clinicalAnalysis, params) {
        return this._post("analysis/clinical", clinicalAnalysis, "interpretation", null, "clear", params);
    }

    /** Create a new Interpretation
    * @param {String} [clinicalAnalysis] - Clinical analysis ID.
    * @param {Object} data - JSON containing clinical interpretation information.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - [[user@]project:]study id.
    * @param {"PRIMARY"|"SECONDARY"} [params.saveAs = "SECONDARY"] - Save interpretation as. The default value is SECONDARY.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    createInterpretation(clinicalAnalysis, data, params) {
        return this._post("analysis/clinical", clinicalAnalysis, "interpretation", null, "create", data, params);
    }

    /** Merge interpretation
    * @param {String} [clinicalAnalysis] - Clinical analysis ID.
    * @param {String} [interpretationId] - Interpretation ID where it will be merged.
    * @param {Object} [data] - JSON containing clinical interpretation to merge from.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - [[user@]project:]study ID.
    * @param {String} [params.secondaryInterpretationId] - Secondary Interpretation ID to merge from.
    * @param {String} [params.findings] - Comma separated list of findings to merge. If not provided, all findings will be merged.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    mergeInterpretation(clinicalAnalysis, interpretationId, data, params) {
        return this._post("analysis/clinical", clinicalAnalysis, "interpretation", interpretationId, "merge", data, params);
    }

    /** Update interpretation fields
    * @param {String} [clinicalAnalysis] - Clinical analysis ID.
    * @param {String} [interpretationId] - Interpretation ID.
    * @param {Object} data - JSON containing clinical interpretation information.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - [[user@]project:]study ID.
    * @param {"ADD"|"SET"|"REMOVE"} [params.primaryFindingsAction = "ADD"] - Action to be performed if the array of primary findings is
    *     being updated. The default value is ADD.
    * @param {"ADD"|"SET"|"REMOVE"} [params.methodsAction = "ADD"] - Action to be performed if the array of methods is being updated. The
    *     default value is ADD.
    * @param {"ADD"|"SET"|"REMOVE"} [params.secondaryFindingsAction = "ADD"] - Action to be performed if the array of secondary findings is
    *     being updated. The default value is ADD.
    * @param {"ADD"|"SET"|"REMOVE"} [params.commentsAction = "ADD"] - Action to be performed if the array of comments is being updated. The
    *     default value is ADD.
    * @param {"PRIMARY"|"SECONDARY"} [params.saveAs] - Save interpretation as.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    updateInterpretation(clinicalAnalysis, interpretationId, data, params) {
        return this._post("analysis/clinical", clinicalAnalysis, "interpretation", interpretationId, "update", data, params);
    }

    /** Delete interpretation
    * @param {String} [clinicalAnalysis] - Clinical analysis ID.
    * @param {String} [interpretations] - Interpretation IDs of the Clinical Analysis.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - [[user@]project:]study ID.
    * @param {String} [params.setAsPrimary] - Interpretation id to set as primary from the list of secondaries in case of deleting the
    *     actual primary one.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    deleteInterpretation(clinicalAnalysis, interpretations, params) {
        return this._delete("analysis/clinical", clinicalAnalysis, "interpretation", interpretations, "delete", params);
    }

    /** Update quality control fields of clinical analysis
    * @param {String} [clinicalAnalysis] - Clinical analysis ID.
    * @param {Object} data - JSON containing quality control information.
    * @param {Object} [params] - The Object containing the following optional parameters:
    * @param {String} [params.study] - [[user@]project:]study ID.
    * @returns {Promise} Promise object in the form of RestResponse instance.
    */
    updateQualityControl(clinicalAnalysis, data, params) {
        return this._post("analysis/clinical", clinicalAnalysis, "qualityControl", null, "update", data, params);
    }

}