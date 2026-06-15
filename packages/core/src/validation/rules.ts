export const RULE_IDS = {
  projectMissingStartSpace: 'project.missing-start-space',
  projectMissingTargetSpace: 'project.missing-target-space',
  backtrackingLongTokenReturn: 'backtracking.long-token-return',
  hintGateTooLate: 'hint.gate-too-late',
  hintTokenUseTooLate: 'hint.token-use-too-late',
  dependencyCircularTokenRequirement: 'dependency.circular-token-requirement',
  puzzleMissingInput: 'puzzle.missing-input',
  reachabilityTargetUnreachable: 'reachability.target-unreachable',
  reachabilityTokenLockedBehindOwnGate: 'reachability.token-locked-behind-own-gate',
  referenceMissingEntity: 'reference.missing-entity',
  rulesetDisabledRequiredRule: 'ruleset.disabled-required-rule',
  timelineIntensityFlat: 'timeline.intensity-flat',
  timelineIntensitySpike: 'timeline.intensity-spike'
} as const;
