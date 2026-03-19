export interface RoleDefinition {
  apiValue: string;
  displayName: string;
  description: string;
  hidden: boolean;
}

export const ROLES: RoleDefinition[] = [
  {
    apiValue: 'master',
    displayName: 'SD-Core',
    description: 'Runs the 5G core network control plane and user plane functions',
    hidden: false,
  },
  {
    apiValue: 'worker',
    displayName: 'Worker',
    description: 'Kubernetes worker node',
    hidden: true,
  },
  {
    apiValue: 'gnbsim',
    displayName: 'gNBsim',
    description: 'Runs the gNB simulator for testing without physical radios',
    hidden: false,
  },
  {
    apiValue: 'oai',
    displayName: 'OAI',
    description: 'Runs the OpenAirInterface 5G RAN stack',
    hidden: false,
  },
  {
    apiValue: 'ueransim',
    displayName: 'UERANSIM',
    description: 'Runs the UERANSIM UE and gNB simulator',
    hidden: false,
  },
  {
    apiValue: 'srsran',
    displayName: 'srsRAN',
    description: 'Runs the srsRAN 5G software radio',
    hidden: false,
  },
  {
    apiValue: 'oscric',
    displayName: 'OSC RIC',
    description: 'Runs the O-RAN Software Community RAN Intelligent Controller',
    hidden: false,
  },
  {
    apiValue: 'n3iwf',
    displayName: 'N3IWF',
    description: 'Runs the Non-3GPP Interworking Function for Wi-Fi access',
    hidden: false,
  },
];

export const VISIBLE_ROLES = ROLES.filter((r) => !r.hidden);

export function displayNameForRole(apiValue: string): string {
  return ROLES.find((r) => r.apiValue === apiValue)?.displayName ?? apiValue;
}

/**
 * Maps assigned node roles to the component names expected by the compose
 * endpoint. The 'master' role implies both k8s and 5gc; 'worker' has no
 * corresponding compose component; all others map 1:1.
 */
export function rolesToComponents(roles: string[]): string[] {
  const components = new Set<string>();
  for (const role of roles) {
    if (role === 'master') {
      components.add('k8s');
      components.add('5gc');
    } else if (role !== 'worker') {
      components.add(role);
    }
  }
  return [...components];
}
