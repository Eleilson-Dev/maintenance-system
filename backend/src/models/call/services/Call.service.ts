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
  createAdminCall = async (userId: string, callData: CreateCallDTO) => {
    try {
      console.log("=======================================");
      console.log("🚀 Iniciando criação do chamado");
      console.log("=======================================");

      // 1. Verifica se existe cobertura
      const coverage = await this.validateCoverage(callData);

      if (!coverage.success) {
        console.log("❌ Cobertura insuficiente.");

        return coverage;
      }

      console.log("✅ Cobertura validada.");
      console.log("👥 Técnicos encontrados:", coverage.technicians.length);
      console.log("📍 Áreas cobertas:", coverage.coveredAreas);

      // 2. Valida responsável
      const responsible = await this.validateResponsible(callData);

      console.log("👤 Resultado responsável:");
      console.log(responsible);

      // 3. validateAssignmentRules()

      // 4. resolveRequiredAssistants()

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

    console.log("📥 Áreas recebidas:", callData.areaIds);

    if (!callData.areaIds.length) {
      throw new AppError(400, "At least one area must be informed.");
    }

    const technicians = await prisma.user.findMany({
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

    console.log("👥 Técnicos encontrados:", technicians.length);

    technicians.forEach((tech) => {
      console.log(
        `👤 ${tech.name} cobre as áreas:`,
        tech.userAreas.map((ua) => ua.areaId),
      );
    });

    const coveredAreas = new Set<string>();

    technicians.forEach((tech) => {
      tech.userAreas.forEach((userArea) => {
        if (callData.areaIds.includes(userArea.areaId)) {
          coveredAreas.add(userArea.areaId);
        }
      });
    });

    console.log("✅ Áreas cobertas:", [...coveredAreas]);

    const missingAreas = callData.areaIds.filter(
      (areaId) => !coveredAreas.has(areaId),
    );

    console.log("❌ Áreas sem cobertura:", missingAreas);

    if (missingAreas.length > 0) {
      return {
        success: false,
        message: "Não existem técnicos para todas as áreas do chamado.",
        missingAreas,
      };
    }

    console.log("🎉 Todas as áreas possuem cobertura.");
    console.log("=======================================");

    return {
      success: true,
      technicians,
      coveredAreas: [...coveredAreas],
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
