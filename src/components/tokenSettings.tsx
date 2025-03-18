import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

interface TokenSettingsProps {
  revokeFreeze: boolean;
  setRevokeFreeze: React.Dispatch<React.SetStateAction<boolean>>;
  revokeMint: boolean;
  setRevokeMint: React.Dispatch<React.SetStateAction<boolean>>;
}

const TokenSettings: React.FC<TokenSettingsProps> = ({
  revokeFreeze,
  setRevokeFreeze,
  revokeMint,
  setRevokeMint,
}) => {
  return (
    <div className="container py-3">
      <div className="row justify-content-center">
        <div className="d-flex flex-column flex-md-row tokens-col">
          <div className="card p-3 flex-fill text-light bg-dark border-light">
            <div className="d-flex justify-content-between">
              <div>
                <h6 className="m-0">Revoke Freeze</h6>
                <small>
                  No one will be able to freeze holders' token accounts anymore
                </small>
              </div>
              <div className="form-check form-switch ms-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={revokeFreeze}
                  onChange={() => setRevokeFreeze(!revokeFreeze)}
                />
              </div>
            </div>
          </div>

          <div className="card p-3 flex-fill text-light bg-dark border-light">
            <div className="d-flex justify-content-between">
              <div>
                <h6 className="m-0">Revoke Mint</h6>
                <small>No one will be able to create more tokens anymore</small>
              </div>
              <div className="form-check form-switch ms-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={revokeMint}
                  onChange={() => setRevokeMint(!revokeMint)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenSettings;
