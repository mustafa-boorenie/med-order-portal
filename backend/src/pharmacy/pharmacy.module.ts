import { Module } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { FhirService } from './fhir.service';

@Module({
  providers: [PharmacyService, FhirService],
  exports: [PharmacyService, FhirService],
})
export class PharmacyModule {}