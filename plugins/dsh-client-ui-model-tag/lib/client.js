window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-model-tag",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0dsh-css:D:\Code\deepseek-harness\packages\client\ui-model-tag\src\client\ModelEffortTagActions.module.css.mjs
		const css = ".jFEO_q_tag{color:var(--ds-ink-2);white-space:nowrap;opacity:.85;font-size:12px}";
		const tagId = "@deepseek-ai/dsh-client-ui-model-tag/ModelEffortTagActions.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-model-tag";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var ModelEffortTagActions_module_css_default = { "tag": "jFEO_q_tag" };
		//#endregion
		//#region src/client/ModelEffortTagActions.tsx
		/**
		* Resolve the request config of the addressed assistant message, if any.
		* @param snapshot - conversation snapshot from the standard useSession source.
		* @param messageId - the addressed finalized assistant message id.
		* @returns the request config, or undefined when the trajectory view is absent
		*   or no matching request is recorded.
		*/
		function requestConfigOf(snapshot, messageId) {
			for (const node of snapshot.nodes) {
				if (node.kind !== "assistant" || node.messageId !== messageId) continue;
				return (snapshot.views.get("trajectory")?.requests.find((candidate) => candidate.resultSeq === node.seq))?.requestConfig;
			}
		}
		/**
		* The tag entry component: a quiet model/effort label for one assistant message.
		* @param props - the addressed message id, the standard useSession source, and the locale seat.
		* @returns the label, or null when the message has no recorded request config.
		*/
		function ModelEffortTagActions({ messageId, useSession, t }) {
			const config = useSession((snapshot) => requestConfigOf(snapshot, messageId));
			const model = config?.model;
			if (model === void 0) return null;
			const provider = config?.provider;
			const effort = config?.reasoningEffort;
			const label = provider !== void 0 ? `${provider}/${model}` : model;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: ModelEffortTagActions_module_css_default.tag,
				title: t("tooltip"),
				children: [label, effort !== void 0 ? ` · ${effort}` : ""]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** `modelEffortTag` namespace dictionaries. */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = { tooltip: "生成此消息所用的提供商/模型与思考等级" };
		/** English dictionary, checked complete against the zh key set. */
		const en = { tooltip: "Provider/model and reasoning effort used to generate this message" };
		//#endregion
		//#region src/client/index.ts
		/** Dictionary namespace owned by this plugin. */
		const NS = "modelEffortTag";
		/** Required services: the slot registry and the copy seat. */
		const inject = ["slots", "locale"];
		/**
		* Client plugin body: register the per-message model/effort tag entry.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-model-tag: dictionaries");
			ctx.slots.inject("conversation.chat.assistant-actions", () => {
				const dispose = ctx.slots.register({
					name: "conversation.chat.assistant-actions",
					id: "model-effort-tag",
					order: 6,
					locale: NS
				}, ModelEffortTagActions);
				return () => {
					dispose();
				};
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map