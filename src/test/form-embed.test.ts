import { describe, expect, it } from "vitest";
import { getFormPreviewSource } from "@/lib/form-embed";

describe("form embed preview", () => {
  it("loads a GHL iframe directly instead of nesting it in srcdoc", () => {
    const source = getFormPreviewSource(
      '<iframe src="https://api.leadconnectorhq.com/widget/form/example"></iframe><script src="https://link.msgsndr.com/js/form_embed.js"></script>',
    );

    expect(source).toEqual({
      src: "https://api.leadconnectorhq.com/widget/form/example",
    });
  });

  it("keeps script-only embeds in an isolated srcdoc", () => {
    const embedCode = '<script src="https://example.com/form.js"></script>';
    expect(getFormPreviewSource(embedCode)).toEqual({ srcDoc: embedCode });
  });
});
