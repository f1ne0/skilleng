import { PartialType } from "@nestjs/swagger";

import { CreateVocabularyEntryDto } from "./create-entry.dto";

export class UpdateVocabularyEntryDto extends PartialType(
  CreateVocabularyEntryDto,
) {}
