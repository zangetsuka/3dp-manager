const SCRIPTS_BASE = 'https://raw.githubusercontent.com/denpiligrim/3dp-manager';
const PINNED_COMMIT = 'a28d7a695450b2ca32a0333b76423710e779e99f';

export const FORWARDING_SCRIPTS = {
  INSTALL: {
    url: `${SCRIPTS_BASE}/${PINNED_COMMIT}/forwarding_install.sh`,
    sha256: 'cb9bb5d13efcc0d4b5279e5ba973bcb13e79ca932caed68b84ca53cbfa0f818c',
  },
  DELETE: {
    url: `${SCRIPTS_BASE}/${PINNED_COMMIT}/forwarding_delete.sh`,
    sha256: '654e8e16b4555236d23ab77f9030c3ce80f10a5a95654605ccf29d2611b0b10b',
  },
};
