"""Static regression checks for the client-facing CMS shell."""

from pathlib import Path
import sys


root = Path(__file__).resolve().parent.parent
admin_html = (root / "admin" / "index.html").read_text(encoding="utf-8")
errors = []

if 'rel="cms-config-url"' not in admin_html or '/admin/config.yml' not in admin_html:
    errors.append("admin/index.html: CMS config link is missing")

if "@sveltia/cms@" not in admin_html or "integrity=" not in admin_html:
    errors.append("admin/index.html: pinned Sveltia CMS script with integrity is missing")

# Sveltia's entry editor is fixed to the top of the viewport. The removed helper bar used a much
# higher stacking order and hid the native Save button, which is the regression reported by the
# client. This is deliberately a narrow static guard; browser QA verifies the actual toolbar.
if "admin-helper-bar" in admin_html or "guide-modal" in admin_html:
    errors.append("admin/index.html: legacy blocking helper UI was reintroduced")

if errors:
    print("Admin shell validation failed:")
    print("\n".join(f" - {error}" for error in errors))
    sys.exit(1)

print("Admin shell is valid: legacy blocking helper UI is absent.")
