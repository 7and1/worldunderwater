import {
  convertHTMLToLexical,
  editorConfigFactory,
} from "@payloadcms/richtext-lexical";
import payloadConfig from "@payload-config";
import { JSDOM } from "jsdom";

let editorConfigPromise: ReturnType<typeof editorConfigFactory.default> | null =
  null;

async function getEditorConfig() {
  if (!editorConfigPromise) {
    editorConfigPromise = editorConfigFactory.default({
      config: payloadConfig,
      parentIsLocalized: false,
      isRoot: true,
    });
  }
  return editorConfigPromise;
}

export async function convertHtmlToLexical(html: string) {
  const editorConfig = await getEditorConfig();
  const normalizedHtml = html && html.trim().length > 0 ? html : "<p></p>";

  return convertHTMLToLexical({
    editorConfig,
    html: normalizedHtml,
    JSDOM,
  });
}
