import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ErrorCode,
  type AvailabilityWindowInput,
  type WorkerProfilePatch,
} from '@parton/api-contracts';
import { Prisma } from '../generated/prisma/client.js';

import { ApiException } from '../common/api.exception.js';
import {
  PUBLIC_CODE_PREFIX,
  allocatePublicCode,
} from '../common/public-code.js';
import { assertValidCoordinates } from '../common/geo.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { assertAvailabilityWindowsValid } from './availability.util.js';
import { computeWorkerCompletion } from './worker-profile.util.js';

@Injectable()
export class WorkersService {
  constructor(private readonly prisma: PrismaService) {}

  private async getProfileRow(userId: string) {
    let profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: {
        availability: true,
        sectors: true,
        occupations: true,
      },
    });
    if (!profile) {
      profile = await this.prisma.workerProfile.create({
        data: {
          userId,
          publicCode: await allocatePublicCode(
            this.prisma,
            PUBLIC_CODE_PREFIX.worker,
          ),
        },
        include: {
          availability: true,
          sectors: true,
          occupations: true,
        },
      });
    }
    return profile;
  }

  private mapProfile(profile: Awaited<ReturnType<typeof this.getProfileRow>>) {
    const completion = computeWorkerCompletion({
      profile,
      windows: profile.availability,
      sectors: profile.sectors,
      occupations: profile.occupations,
    });
    return {
      id: profile.id,
      userId: profile.userId,
      publicCode: profile.publicCode,
      firstName: profile.firstName,
      lastName: profile.lastName,
      birthDate: profile.birthDate
        ? profile.birthDate.toISOString().slice(0, 10)
        : null,
      gender: profile.gender,
      homeLatitude: profile.homeLatitude
        ? Number(profile.homeLatitude)
        : null,
      homeLongitude: profile.homeLongitude
        ? Number(profile.homeLongitude)
        : null,
      nightShiftAvailable: profile.nightShiftAvailable,
      sectorCodes: profile.sectors.map((s) => s.sectorCode),
      occupationCodes: profile.occupations.map((o) => o.occupationCode),
      profileComplete: completion.complete,
      completionMissing: completion.missing,
    };
  }

  async getMe(userId: string) {
    const profile = await this.getProfileRow(userId);
    return this.mapProfile(profile);
  }

  async patchMe(userId: string, body: WorkerProfilePatch) {
    if (body.homeLatitude !== undefined && body.homeLongitude !== undefined) {
      assertValidCoordinates(body.homeLatitude, body.homeLongitude);
    } else if (
      body.homeLatitude !== undefined ||
      body.homeLongitude !== undefined
    ) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Konum için enlem ve boylam birlikte gerekli.',
      );
    }

    const profile = await this.getProfileRow(userId);

    await this.prisma.workerProfile.update({
      where: { id: profile.id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
        gender: body.gender,
        nightShiftAvailable: body.nightShiftAvailable,
        homeLatitude:
          body.homeLatitude !== undefined
            ? new Prisma.Decimal(body.homeLatitude)
            : undefined,
        homeLongitude:
          body.homeLongitude !== undefined
            ? new Prisma.Decimal(body.homeLongitude)
            : undefined,
      },
    });

    if (body.sectorCodes) {
      await this.prisma.workerSector.deleteMany({
        where: { workerProfileId: profile.id },
      });
      if (body.sectorCodes.length > 0) {
        await this.prisma.workerSector.createMany({
          data: body.sectorCodes.map((sectorCode) => ({
            workerProfileId: profile.id,
            sectorCode,
          })),
        });
      }
    }

    if (body.occupationCodes) {
      await this.prisma.workerOccupation.deleteMany({
        where: { workerProfileId: profile.id },
      });
      if (body.occupationCodes.length > 0) {
        await this.prisma.workerOccupation.createMany({
          data: body.occupationCodes.map((occupationCode) => ({
            workerProfileId: profile.id,
            occupationCode,
          })),
        });
      }
    }

    return this.getMe(userId);
  }

  async getAvailability(userId: string) {
    const profile = await this.getProfileRow(userId);
    return {
      windows: profile.availability.map((w) => ({
        dayOfWeek: w.dayOfWeek,
        startMinute: w.startMinute,
        endMinute: w.endMinute,
        crossesMidnight: w.crossesMidnight,
      })),
    };
  }

  async putAvailability(userId: string, windows: AvailabilityWindowInput[]) {
    assertAvailabilityWindowsValid(windows);
    const profile = await this.getProfileRow(userId);

    await this.prisma.$transaction([
      this.prisma.availabilityWindow.deleteMany({
        where: { workerProfileId: profile.id },
      }),
      this.prisma.availabilityWindow.createMany({
        data: windows.map((w) => ({
          workerProfileId: profile.id,
          dayOfWeek: w.dayOfWeek,
          startMinute: w.startMinute,
          endMinute: w.endMinute,
          crossesMidnight:
            w.crossesMidnight === true ||
            (w.endMinute <= w.startMinute && w.endMinute !== w.startMinute),
        })),
      }),
    ]);

    return this.getAvailability(userId);
  }

  async getSetupStatus(userId: string) {
    const profile = await this.getProfileRow(userId);
    const completion = computeWorkerCompletion({
      profile,
      windows: profile.availability,
      sectors: profile.sectors,
      occupations: profile.occupations,
    });
    return completion;
  }
}
