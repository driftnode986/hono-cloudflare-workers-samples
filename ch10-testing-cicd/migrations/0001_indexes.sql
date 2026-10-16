-- #region indexes
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX idx_resources_tenant ON resources(tenant_id);
CREATE INDEX idx_resources_tenant_status ON resources(tenant_id, status);
-- #endregion
