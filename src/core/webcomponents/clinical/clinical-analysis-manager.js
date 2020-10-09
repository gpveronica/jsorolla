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

export default class ClinicalAnalysisManager {

    constructor(clinicalAnalysis, opencgaSession) {
        this.clinicalAnalysis = clinicalAnalysis;
        this.opencgaSession = opencgaSession;

        this.init();
    }

    init() {
        this.addedVariants = [];
        this.removedVariants = [];
        this.updatedVariants = [];
    }

    /**
     * clear all changed variants.
     */
    reset() {
        this.init();

        this.clinicalAnalysis = JSON.parse(JSON.stringify(this.clinicalAnalysis));
    }

    getStatuses() {
        return ["READY_FOR_INTERPRETATION", "READY_FOR_REPORT", "CLOSED", "REJECTED"];
    }

    getProbandQc() {
        return this.clinicalAnalysis?.proband?.qualityControl;
    }

    getProbandSampleQc(sampleIdx = 0) {
        let qc = null;
        if (this.clinicalAnalysis?.proband?.samples.length > 0 && this.clinicalAnalysis.proband.samples[sampleIdx]?.qualityControl) {
            qc = this.clinicalAnalysis.proband.samples[sampleIdx].qualityControl;
        }
        return qc;
    }


    addVariant(variant) {
        // First, check if the variant was selected to be removed
        let index = this.removedVariants.findIndex(v => v.id === variant.id);
        if (index >= 0) {
            this.removedVariants.splice(index, 1);
        } else {
            // Second, check variant is new and selected to be added
            index = this.clinicalAnalysis.interpretation.primaryFindings.findIndex(v => v.id === variant.id);
            if (index === -1) {
                this.addedVariants.push(variant);
            } else {
                // Third, this cannot happen, variant must exist somewhere
                console.error("There must be an error, variant " + variant.id + " seems to exist.");
            }
        }
    }

    removeVariant(variant) {
        // First, check if the variant was selected to be added
        let index = this.addedVariants.findIndex(v => v.id === variant.id);
        if (index >= 0) {
            this.addedVariants.splice(index, 1);
        } else {
            // Second, check if the variant was added to be inserted but not inserted yet
            index = this.clinicalAnalysis.interpretation.primaryFindings.findIndex(v => v.id === variant.id);
            if (index >= 0) {
                this.removedVariants.push(variant);
            } else {
                // Third, this cannot happen, variant must exist somewhere
                console.error("There must be an error, variant " + variant.id + " seems to not exist.");
            }
        }
    }

    updateInterpretation(callback) {
        if (this.addedVariants.length === 0 && this.removedVariants.length === 0) {
            console.log("Nothing to do");
            return;
        }

        // Prepare interpretation object for the update
        let interpretation = {
            primaryFindings: this.clinicalAnalysis.interpretation.primaryFindings
        };

        // Add selected variants
        if (this.addedVariants.length > 0) {
            for (let addedVariant of this.addedVariants) {
                let index = this.clinicalAnalysis.interpretation.primaryFindings.findIndex(v => v.id === addedVariant.id);
                if (index === -1) {
                    interpretation.primaryFindings.push(addedVariant);
                } else {
                    console.error("There must be an error, variant " + addedVariant.id + " already exist.");
                }
            }
        }

        // Remove variants
        if (this.removedVariants.length > 0) {
            for (let removedVariant of this.removedVariants) {
                let index = this.clinicalAnalysis.interpretation.primaryFindings.findIndex(v => v.id === removedVariant.id);
                if (index >= 0) {
                    interpretation.primaryFindings.splice(index, 1);
                } else {
                    console.error("There must be an error, variant " + removedVariant.id + " seems to not exist.");
                }
            }
        }

        this.opencgaSession.opencgaClient.clinical().updateInterpretation(this.clinicalAnalysis.id, this.clinicalAnalysis.interpretation.id, interpretation,
            {
                study: this.opencgaSession.study.fqn,
                primaryFindingsAction: "SET",
                // secondaryFindingsAction: "SET",
            })
            .then(restResponse => {
                // this.opencgaSession.opencgaClient.clinical().info(this.clinicalAnalysis.id, {study: this.opencgaSession.study.fqn})
                //     .then(restResponse => {
                //         this.clinicalAnalysis = restResponse.responses[0].results[0];
                //         callback(this.clinicalAnalysis);
                //     });
                callback(this.clinicalAnalysis);

                // Notify
                Swal.fire(
                    "Interpretation Saved",
                    "Primary findings have been saved.",
                    "success"
                );

                // Reset
                this.addedVariants = [];
                this.removedVariants = [];
            })
            .catch(restResponse => {
                console.error(restResponse);
                //optional chaining is to make sure the response is a restResponse instance
                const msg = restResponse?.getResultEvents?.("ERROR")?.map(event => event.message).join("<br>") ?? "Server Error";
                Swal.fire({
                    title: "Error",
                    icon: "error",
                    html: msg
                });
            });
    }

}
