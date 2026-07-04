import { injectable } from "tsyringe";
import { prisma } from "../../../config/db/database.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { CreateCallDTO } from "../schemas/Call.schema.js";
import {
  CoverageValidationResult,
  ResponsibleValidationResult,
} from "../types/CallValidation.types.js";

@injectable()
export class CallService {
  previewCall = async (callData: CreateCallDTO) => {
    console.log("=======================================");
    console.log("🔍 PREVIEW CALL");
    console.log("=======================================");

    // 1. cobertura (base do sistema)
    const coverage = await this.validateCoverage(callData);

    // se nem tem cobertura, já responde erro
    if (!coverage.success) {
      return {
        success: false,
        step: "coverage",
        message: coverage.message,
        missingAreas: coverage.missingAreas,
      };
    }

    // 2. regras de atribuição
    const rules = this.validateAssignmentRules(callData);

    // 3. responsável (só simulação, não bloqueia ainda)
    const responsible = await this.validateResponsible(callData);

    // 4. decisão final do preview
    const requiresResponsible = rules.requiresResponsible;

    const requiresTeam =
      rules.requiresTeam ||
      (responsible?.success ? responsible.needsAssistants : false);

    // 5. resposta final do preview
    const result = {
      success: true,
      coverage: {
        technicians: coverage.technicians.length,
        coveredAreas: coverage.coveredAreas,
      },
      rules,
      responsiblePreview: responsible?.success
        ? {
            user: responsible.user.name,
            coveredAreas: responsible.coveredAreas,
            missingAreas: responsible.missingAreas,
          }
        : null,
      requiresResponsible,
      requiresTeam,
    };

    console.log("📦 PREVIEW RESULT:", result);

    return result;
  };

  createAdminCall = async (userId: string, callData: CreateCallDTO) => {
    try {
      console.log("=======================================");
      console.log("🚀 Iniciando criação do chamado");
      console.log("=======================================");

      // 1. Verifica cobertura
      const coverage = await this.validateCoverage(callData);

      if (!coverage.success) {
        console.log("❌ Cobertura insuficiente.");
        return coverage;
      }

      console.log("✅ Cobertura validada.");

      // 2. Descobre quais regras esse chamado possui
      const assignmentRules = this.validateAssignmentRules(callData);

      // 3. Se o chamado exigir responsável, valida
      if (assignmentRules.requiresResponsible) {
        const responsible = await this.validateResponsible(callData);

        if (!responsible?.success) {
          console.log("❌ Responsável inválido.");
          return responsible;
        }

        console.log("✅ Responsável validado.");
        console.log("👤", responsible.user.name);
        console.log("📍 Áreas cobertas:", responsible.coveredAreas);
        console.log("❌ Áreas restantes:", responsible.missingAreas);

        // 4. resolveRequiredAssistants()
      }

      // 5. createCall()
    } catch (error) {
      console.log("💥 Error:", error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(500, "Internal server error.");
    }
  };

  private validateCoverage = async (
    callData: CreateCallDTO,
  ): Promise<CoverageValidationResult> => {
    console.log("=======================================");
    console.log("🚀 Iniciando validação de cobertura");
    console.log("=======================================");

    // 1. Valida entrada
    if (!callData.areaIds.length) {
      throw new AppError(400, "At least one area must be informed.");
    }

    console.log("📥 Áreas do chamado:", callData.areaIds);
    console.log("📊 Nível mínimo:", callData.requiredLevel);

    // 2. Busca todos os técnicos que possuem pelo menos uma das áreas
    const candidateTechnicians = await prisma.user.findMany({
      where: {
        userAreas: {
          some: {
            areaId: {
              in: callData.areaIds,
            },
          },
        },
      },
      include: {
        userAreas: true,
      },
    });

    console.log("👥 Técnicos candidatos:", candidateTechnicians.length);

    // 3. Mantém apenas técnicos com nível suficiente
    const LEVEL_ORDER = {
      JUNIOR: 1,
      MID: 2,
      SENIOR: 3,
      SPECIALIST: 4,
    } as const;

    const eligibleTechnicians = candidateTechnicians.filter(
      (technician) =>
        LEVEL_ORDER[technician.level] >= LEVEL_ORDER[callData.requiredLevel],
    );

    console.log("✅ Técnicos elegíveis:", eligibleTechnicians.length);

    // 4. Descobre quais áreas estão cobertas
    const coveredAreas = new Set<string>();

    eligibleTechnicians.forEach((technician) => {
      console.log(
        `👤 ${technician.name} (${technician.level}) ->`,
        technician.userAreas.map((ua) => ua.areaId),
      );

      technician.userAreas.forEach((userArea) => {
        if (callData.areaIds.includes(userArea.areaId)) {
          coveredAreas.add(userArea.areaId);
        }
      });
    });

    // 5. Descobre quais áreas ficaram descobertas
    const missingAreas = callData.areaIds.filter(
      (areaId) => !coveredAreas.has(areaId),
    );

    console.log("✅ Áreas cobertas:", [...coveredAreas]);
    console.log("❌ Áreas sem cobertura:", missingAreas);

    if (missingAreas.length > 0) {
      return {
        success: false,
        message:
          "Não existem técnicos com área e nível suficientes para atender todas as áreas do chamado.",
        missingAreas,
      };
    }

    console.log("🎉 Cobertura validada com sucesso.");
    console.log("=======================================");

    return {
      success: true,
      technicians: eligibleTechnicians,
      coveredAreas: [...coveredAreas],
    };
  };

  private validateAssignmentRules = (callData: CreateCallDTO) => {
    console.log("=======================================");
    console.log("📋 Validando regras de atribuição");
    console.log("=======================================");

    const isMultiAreaCall = callData.areaIds.length > 1;

    const requiresResponsible = isMultiAreaCall;
    const requiresTeam = isMultiAreaCall;

    console.log("📍 Áreas do chamado:", callData.areaIds.length);
    console.log("👤 Responsável obrigatório:", requiresResponsible);
    console.log("👥 Formação de equipe obrigatória:", requiresTeam);

    return {
      requiresResponsible,
      requiresTeam,
    };
  };

  private validateResponsible = async (
    callData: CreateCallDTO,
  ): Promise<ResponsibleValidationResult> => {
    console.log("=======================================");
    console.log("👤 Iniciando validação do responsável");
    console.log("=======================================");

    // 1. Não foi informado responsável
    if (!callData.assignedToId) {
      console.log("⚠️ Nenhum responsável informado.");
      return null;
    }

    // 2. Busca o usuário
    const user = await prisma.user.findUnique({
      where: {
        id: callData.assignedToId,
      },
      include: {
        userAreas: true,
      },
    });

    console.log("👤 Responsável encontrado:", user?.name);

    // 3. Existe?
    if (!user) {
      return {
        success: false,
        message: "Responsible user not found.",
      };
    }

    // 4. Possui nível suficiente?
    console.log("📊 Nível exigido:", callData.requiredLevel);
    console.log("📊 Nível do usuário:", user.level);

    if (user.level < callData.requiredLevel) {
      return {
        success: false,
        message: "Responsible does not have the required level.",
      };
    }

    // 5. Áreas do responsável
    const userAreaIds = user.userAreas.map((ua) => ua.areaId);

    console.log("📍 Áreas do responsável:", userAreaIds);

    // 6. Descobre quais áreas ele cobre
    const coveredAreas = callData.areaIds.filter((areaId) =>
      userAreaIds.includes(areaId),
    );

    // 7. Descobre quais áreas ficaram faltando
    const missingAreas = callData.areaIds.filter(
      (areaId) => !userAreaIds.includes(areaId),
    );

    console.log("✅ Áreas cobertas:", coveredAreas);
    console.log("❌ Áreas faltantes:", missingAreas);

    return {
      success: true,
      user,
      coveredAreas,
      missingAreas,
      needsAssistants: missingAreas.length > 0,
    };
  };

  private validateAssistants = async (
    callData: CreateCallDTO,
    responsibleUser: any,
  ) => {
    console.log("🔍 validateAssistants called with:", callData.areaIds);

    if (!callData.areaIds || callData.areaIds.length === 0) {
      console.log("⚠️ No areas provided. No assistants needed.");
      return [];
    }

    // 1. calcula áreas que o responsável NÃO cobre
    const missingAreas = callData.areaIds.filter(
      (areaId) =>
        !responsibleUser.userAreas.some((ua: any) => ua.areaId === areaId),
    );

    console.log("📌 Missing areas:", missingAreas);

    if (missingAreas.length === 0) {
      console.log(
        "✅ Responsible already covers all areas. No assistants needed.",
      );
      return [];
    }

    // 2. busca possíveis auxiliares
    const candidates = await prisma.user.findMany({
      where: {
        userAreas: {
          some: {
            areaId: {
              in: missingAreas,
            },
          },
        },
      },
      include: {
        userAreas: true,
      },
    });

    console.log("👥 Assistant candidates found:", candidates.length);

    if (!candidates.length) {
      console.log("❌ No assistants found for missing areas");
      throw new AppError(400, "No available assistants for required areas");
    }

    // 3. filtra por nível (pode ajustar regra depois)
    const validAssistants = candidates.filter((user) => {
      const isValid = user.level >= callData.requiredLevel;
      console.log(
        `🧪 Checking ${user.name}: level=${user.level} valid=${isValid}`,
      );
      return isValid;
    });

    console.log(
      "✅ Valid assistants after level filter:",
      validAssistants.length,
    );

    if (!validAssistants.length) {
      console.log("❌ No assistants meet required level");
      throw new AppError(400, "No assistants meet required level");
    }

    return validAssistants;
  };

  getCalls = async () => {
    try {
      const allCalls = await prisma.call.findMany({
        include: { sector: true, openedBy: true, assignedTo: true },
        orderBy: { createdAt: "desc" },
      });

      return allCalls;
    } catch (error) {
      console.log(error);

      throw new AppError(400, "Error searching all sectors.");
    }
  };
}
