export interface OrderData {
  id: string;
  patientName: string;
  patientEmail: string;
  doctorId?: string;
  items: Array<{
    product: {
      name: string;
      sku: string;
    };
    quantity: number;
  }>;
}

export interface FhirMedicationRequest {
  resourceType: 'MedicationRequest';
  id: string;
  status: 'active' | 'completed' | 'cancelled';
  intent: 'order';
  medicationCodeableConcept: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  subject: {
    reference: string;
    display: string;
  };
  authoredOn: string;
  requester: {
    reference: string;
    display: string;
  };
  dosageInstruction: Array<{
    text: string;
    timing: {
      repeat: {
        frequency: number;
        period: number;
        periodUnit: string;
      };
    };
  }>;
  dispenseRequest: {
    quantity: {
      value: number;
      unit: string;
      system: string;
      code: string;
    };
    performer: {
      reference: string;
    };
  };
}

export class MedicationRequestBuilder {
  static build(orderData: OrderData): FhirMedicationRequest {
    return {
      resourceType: 'MedicationRequest',
      id: `med-req-${orderData.id}`,
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: {
        coding: orderData.items.map(item => ({
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: item.product.sku,
          display: item.product.name,
        })),
      },
      subject: {
        reference: `Patient/${orderData.patientEmail}`,
        display: orderData.patientName,
      },
      authoredOn: new Date().toISOString(),
      requester: {
        reference: orderData.doctorId 
          ? `Practitioner/${orderData.doctorId}` 
          : 'Organization/med-order-portal',
        display: 'Medical Order Portal',
      },
      dosageInstruction: orderData.items.map(item => ({
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
          value: orderData.items.reduce((total, item) => total + item.quantity, 0),
          unit: 'units',
          system: 'http://unitsofmeasure.org',
          code: 'units',
        },
        performer: {
          reference: 'Organization/partner-pharmacy',
        },
      },
    };
  }

  static validate(medicationRequest: FhirMedicationRequest): boolean {
    const requiredFields = [
      'resourceType',
      'id',
      'status',
      'intent',
      'medicationCodeableConcept',
      'subject',
      'authoredOn',
      'requester',
    ];

    return requiredFields.every(field => 
      medicationRequest[field as keyof FhirMedicationRequest] !== undefined
    );
  }
}