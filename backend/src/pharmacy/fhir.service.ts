import { Injectable } from '@nestjs/common';

@Injectable()
export class FhirService {
  createMedicationRequest(order: any) {
    const medicationRequest = {
      resourceType: 'MedicationRequest',
      id: `med-req-${order.id}`,
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: {
        coding: order.items.map((item: any) => ({
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: item.product.sku,
          display: item.product.name,
        })),
      },
      subject: {
        reference: `Patient/${order.patientEmail}`,
        display: order.patientName,
      },
      authoredOn: new Date().toISOString(),
      requester: {
        reference: order.doctorId ? `Practitioner/${order.doctorId}` : 'Organization/med-portal',
        display: 'Medical Order Portal',
      },
      dosageInstruction: order.items.map((item: any) => ({
        text: `Take as directed - Quantity: ${item.quantity}`,
        timing: {
          repeat: {
            frequency: 1,
            period: 1,
            periodUnit: 'd',
          },
        },
      })),
      dispenseRequest: {
        quantity: {
          value: order.items.reduce((total: number, item: any) => total + item.quantity, 0),
          unit: 'units',
          system: 'http://unitsofmeasure.org',
          code: 'units',
        },
        performer: {
          reference: 'Organization/partner-pharmacy',
        },
      },
      meta: {
        profile: ['http://hl7.org/fhir/StructureDefinition/MedicationRequest'],
        tag: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
            code: 'TREAT',
            display: 'Treatment',
          },
        ],
      },
    };

    return medicationRequest;
  }

  createMedicationDispense(medicationRequest: any, status = 'completed') {
    return {
      resourceType: 'MedicationDispense',
      id: `med-disp-${medicationRequest.id}`,
      status,
      medicationCodeableConcept: medicationRequest.medicationCodeableConcept,
      subject: medicationRequest.subject,
      performer: [
        {
          actor: {
            reference: 'Organization/partner-pharmacy',
            display: 'Partner Pharmacy',
          },
        },
      ],
      authorizingPrescription: [
        {
          reference: `MedicationRequest/${medicationRequest.id}`,
        },
      ],
      quantity: medicationRequest.dispenseRequest.quantity,
      whenHandedOver: new Date().toISOString(),
      meta: {
        profile: ['http://hl7.org/fhir/StructureDefinition/MedicationDispense'],
      },
    };
  }

  validateFhirResource(resource: any): boolean {
    // Basic validation - in production, use a proper FHIR validator
    const requiredFields = ['resourceType', 'id', 'status'];
    return requiredFields.every(field => field in resource);
  }
}