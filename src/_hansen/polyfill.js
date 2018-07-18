export function getDoNotDisturb() {
  return false;
}

export class AutoLaunch {
  constructor({ name }) {
    this.name = name;
    this.enabled = false;
  }
  enable() {
    this.enabled = true;
  }
  disable() {
    this.enabled = false;
  }
  isEnabled() {
    return !!this.enabled;
  }
}