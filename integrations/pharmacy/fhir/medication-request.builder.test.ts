import { MedicationRequestBuilder, OrderData } from './medication-request.builder';

describe('MedicationRequestBuilder', () => {
  const mockOrderData: OrderData = {
    id: 'order-123',
    patientName: 'John Doe',
    patientEmail: 'john.doe@example.com',
    doctorId: 'doctor-456',
    items: [
      {
        product: {
          name: 'Insulin Pen (Humalog)',
          sku: 'INS-HUM-001',
        },
        quantity: 2,
      },
      {
        product: {
          name: 'Blood Pressure Monitor',
          sku: 'BPM-DIG-001',
        },
        quantity: 1,
      },
    ],
  };

  describe('build', () => {
    it('should create a valid FHIR MedicationRequest', () => {
      const medicationRequest = MedicationRequestBuilder.build(mockOrderData);

      expect(medicationRequest.resourceType).toBe('MedicationRequest');
      expect(medicationRequest.id).toBe('med-req-order-123');
      expect(medicationRequest.status).toBe('active');
      expect(medicationRequest.intent).toBe('order');
    });

    it('should include patient information', () => {
      const medicationRequest = MedicationRequestBuilder.build(mockOrderData);

      expect(medicationRequest.subject.display).toBe('John Doe');
      expect(medicationRequest.subject.reference).toBe('Patient/john.doe@example.com');
    });

    it('should include medication coding for all items', () => {
      const medicationRequest = MedicationRequestBuilder.build(mockOrderData);

      expect(medicationRequest.medicationCodeableConcept.coding).toHaveLength(2);
      expect(medicationRequest.medicationCodeableConcept.coding[0]).toEqual({
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: 'INS-HUM-001',
        display: 'Insulin Pen (Humalog)',
      });
    });

    it('should calculate total quantity correctly', () => {
      const medicationRequest = MedicationRequestBuilder.build(mockOrderData);

      expect(medicationRequest.dispenseRequest.quantity.value).toBe(3); // 2 + 1
    });

    it('should include dosage instructions for each item', () => {
      const medicationRequest = MedicationRequestBuilder.build(mockOrderData);

      expect(medicationRequest.dosageInstruction).toHaveLength(2);
      expect(medicationRequest.dosageInstruction[0].text).toBe('Take as directed - Quantity: 2');
    });

    it('should use doctor reference when doctorId is provided', () => {
      const medicationRequest = MedicationRequestBuilder.build(mockOrderData);

      expect(medicationRequest.requester.reference).toBe('Practitioner/doctor-456');
    });

    it('should use organization reference when doctorId is not provided', () => {
      const orderWithoutDoctor = { ...mockOrderData, doctorId: undefined };
      const medicationRequest = MedicationRequestBuilder.build(orderWithoutDoctor);

      expect(medicationRequest.requester.reference).toBe('Organization/med-order-portal');
    });
  });

  describe('validate', () => {
    it('should return true for valid medication request', () => {
      const medicationRequest = MedicationRequestBuilder.build(mockOrderData);
      const isValid = MedicationRequestBuilder.validate(medicationRequest);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid medication request', () => {
      const invalidRequest = {
        resourceType: 'MedicationRequest',
        // Missing required fields
      } as any;

      const isValid = MedicationRequestBuilder.validate(invalidRequest);

      expect(isValid).toBe(false);
    });
  });
});