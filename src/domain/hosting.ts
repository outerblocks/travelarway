/**
 * Control-plane vs personal-data plane.
 *
 * OuterBlocks choice 9 Nov 2026: AWS Region Europe (Ireland) eu-west-1.
 * Africa (Cape Town) af-south-1 is not used. Ireland is still a transfer from
 * TZ/KE/UG/RW/MW/ET — passenger SoR and Keycloak stay on a local plane until a
 * named transfer instrument exists.
 *
 * Sources: AWS Regions table; AWS GDPR DPA (Service Terms); PDPA TZ ss.31–32;
 * Kenya ODPC 2026 cross-border guidance (foreign cloud = transfer).
 */

export const AWS_CONTROL_PLANE_REGION = 'eu-west-1' as const;
export const REJECTED_AWS_REGIONS = ['af-south-1'] as const;

export type PiiDataPlane = 'local' | 'aws_ireland';

export function assertControlPlaneRegion(region: string): asserts region is typeof AWS_CONTROL_PLANE_REGION {
  if ((REJECTED_AWS_REGIONS as readonly string[]).includes(region)) {
    throw new Error(
      'AWS_CONTROL_PLANE_REGION cannot be af-south-1. OuterBlocks uses Europe (Ireland) eu-west-1.',
    );
  }
  if (region !== AWS_CONTROL_PLANE_REGION) {
    throw new Error(
      `AWS_CONTROL_PLANE_REGION must be ${AWS_CONTROL_PLANE_REGION} (received an unsupported region)`,
    );
  }
}

export function assertPiiPlane(plane: string, irelandTransferRecorded: boolean, appEnv: string): PiiDataPlane {
  if (plane !== 'local' && plane !== 'aws_ireland') {
    throw new Error('PII_DATA_PLANE must be local or aws_ireland');
  }
  if (plane === 'aws_ireland' && !irelandTransferRecorded && appEnv === 'production') {
    throw new Error(
      'Passenger identity cannot sit in eu-west-1 until IRELAND_PII_TRANSFER_RECORDED=true and counsel has filed the destination as Ireland.',
    );
  }
  return plane;
}

export function personalDataAllowedOnControlPlane(piiPlane: PiiDataPlane): boolean {
  return piiPlane === 'aws_ireland';
}
