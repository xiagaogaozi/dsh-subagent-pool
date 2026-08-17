window.__ModuleLoader__.load({
	id: "@xiagaogaozi/dsh-subagent-pool",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region \0dsh-css:D:\github\dsh-subagent-pool\src\client\SubagentPoolPage.module.css.mjs
		const css = "._4itypG_wrap{--subagent-pool-settings-field-width:280px;flex-direction:column;max-width:680px;padding:0 16px 16px;display:flex}._4itypG_pickerRow{border-bottom:1px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}._4itypG_form{flex-direction:column;display:flex}._4itypG_row{border-bottom:1px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}._4itypG_row:last-child{border-bottom:none}._4itypG_rowText{flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px;display:flex}._4itypG_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}._4itypG_desc{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}._4itypG_selectorWrap{flex:1;min-width:0;display:flex}._4itypG_row ._4itypG_selectorWrap{flex:0 1 var(--subagent-pool-settings-field-width);width:var(--subagent-pool-settings-field-width)}._4itypG_selectorWrap [role=menu]{width:100%;min-width:0;max-width:none}._4itypG_selector{background:var(--dsw-alias-bg-module-platform);height:36px;font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;border:none;border-radius:18px;flex:1;justify-content:flex-start;align-items:center;gap:12px;min-width:0;padding:0 14px;font-size:14px;line-height:22px;display:inline-flex}._4itypG_selector:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}._4itypG_selector:disabled{opacity:.5;cursor:default}._4itypG_selectorText{text-overflow:ellipsis;white-space:nowrap;text-align:left;flex:1;min-width:0;overflow:hidden}._4itypG_chevron{flex:none}._4itypG_nameInput{flex:0 1 var(--subagent-pool-settings-field-width);width:var(--subagent-pool-settings-field-width)}._4itypG_textarea{flex:0 1 var(--subagent-pool-settings-field-width);width:var(--subagent-pool-settings-field-width);border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);min-height:64px;font:inherit;color:var(--dsw-alias-label-primary);resize:vertical;box-sizing:border-box;border-radius:8px;padding:6px 8px;font-size:14px;line-height:22px}._4itypG_textarea:focus{border-color:var(--dsw-alias-brand-primary);outline:none}._4itypG_textarea::placeholder{color:var(--dsw-alias-label-dimmed)}._4itypG_empty{color:var(--dsw-alias-label-secondary);padding:16px 0;font-size:13px;line-height:20px}._4itypG_error{color:var(--dsw-alias-state-error-primary);padding:16px 0;font-size:13px;line-height:20px}._4itypG_hint{color:var(--dsw-alias-label-secondary);padding-top:12px;font-size:12px;line-height:18px}._4itypG_danger{color:var(--dsw-alias-state-error-primary)}";
		const tagId = "@xiagaogaozi/dsh-subagent-pool/SubagentPoolPage.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@xiagaogaozi/dsh-subagent-pool";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var SubagentPoolPage_module_css_default = {
			"chevron": "_4itypG_chevron",
			"danger": "_4itypG_danger",
			"desc": "_4itypG_desc",
			"empty": "_4itypG_empty",
			"error": "_4itypG_error",
			"form": "_4itypG_form",
			"hint": "_4itypG_hint",
			"nameInput": "_4itypG_nameInput",
			"pickerRow": "_4itypG_pickerRow",
			"row": "_4itypG_row",
			"rowText": "_4itypG_rowText",
			"selector": "_4itypG_selector",
			"selectorText": "_4itypG_selectorText",
			"selectorWrap": "_4itypG_selectorWrap",
			"textarea": "_4itypG_textarea",
			"title": "_4itypG_title",
			"wrap": "_4itypG_wrap"
		};
		//#endregion
		//#region lib/client/SubagentPoolPage.js
		/**
		* 「子代理」settings page: manage the named-subagent library (name,
		* description, model, reasoning effort, and agent preset). The library lives
		* in the host `settings` service; this page talks to it through the same-origin
		* HTTP route registered by the host half.
		*
		* Layout follows the official Setting-Cell convention (16/0 rows, border-l2
		* hairlines, 14px titles, 36px selector pills backed by primitives `Menu`,
		* official `Icon*Outline*` glyphs, `--dsw-*` tokens only).
		* @module dsh-subagent-pool/client/SubagentPoolPage
		*/
		/** Same-origin settings-page endpoint served by the host half. */
		const PROFILES_ROUTE = "/plugins/dsh-subagent-pool/profiles";
		async function apiGet() {
			const res = await fetch(PROFILES_ROUTE, { cache: "no-store" });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return res.json();
		}
		async function apiSave(profiles) {
			const res = await fetch(PROFILES_ROUTE, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ profiles })
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			await res.json();
		}
		const EMPTY_DRAFT = {
			name: "",
			description: "",
			model: "",
			reasoningEffort: "",
			preset: ""
		};
		/** One pill selector: Menu + official chevron, in the Setting-Cell style. */
		function Selector({ value, options, display, emptyLabel, onSelect, disabled }) {
			const [open, setOpen] = (0, react.useState)(false);
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open,
				onClose: () => {
					setOpen(false);
				},
				items: ["", ...options.filter((o) => o !== "")].map((id) => ({
					id,
					label: id === "" ? emptyLabel : display(id)
				})),
				selectedId: value,
				onSelect: (id) => {
					onSelect(id);
					setOpen(false);
				},
				align: "end",
				className: SubagentPoolPage_module_css_default.selectorWrap,
				anchor: (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: SubagentPoolPage_module_css_default.selector,
					"aria-haspopup": "menu",
					"aria-expanded": open,
					disabled,
					onClick: () => {
						setOpen((v) => !v);
					},
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: SubagentPoolPage_module_css_default.selectorText,
						children: value === "" ? emptyLabel : display(value)
					}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: SubagentPoolPage_module_css_default.chevron })]
				})
			});
		}
		function SubagentPoolPage() {
			const [snap, setSnap] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [selected, setSelected] = (0, react.useState)("");
			const [draft, setDraft] = (0, react.useState)(null);
			const [confirmDelete, setConfirmDelete] = (0, react.useState)(false);
			const [busy, setBusy] = (0, react.useState)(false);
			const load = async () => {
				try {
					setSnap(await apiGet());
					setError(null);
				} catch (err) {
					setSnap(null);
					setError(`无法加载子代理配置：${err instanceof Error ? err.message : String(err)}（插件 host 可能未更新，请重启 dsh 后重试）`);
				}
			};
			(0, react.useEffect)(() => {
				load();
			}, []);
			const save = async (profiles) => {
				setBusy(true);
				try {
					await apiSave(profiles);
					await load();
				} finally {
					setBusy(false);
				}
			};
			const onSelect = (name) => {
				if (snap === null) return;
				setSelected(name);
				const found = snap.profiles.find((p) => p.name === name);
				setDraft(found !== void 0 ? { ...found } : null);
				setConfirmDelete(false);
			};
			const onAdd = () => {
				setSelected("");
				setDraft({ ...EMPTY_DRAFT });
				setConfirmDelete(false);
			};
			const onSave = async () => {
				if (draft === null || snap === null) return;
				const name = draft.name.trim();
				if (name === "") return;
				await save(snap.profiles.some((p) => p.name === name) ? snap.profiles.map((p) => p.name === name ? draft : p) : [...snap.profiles, draft]);
				setSelected(name);
				setConfirmDelete(false);
			};
			const onDelete = async () => {
				if (draft === null || snap === null) return;
				if (!confirmDelete) {
					setConfirmDelete(true);
					return;
				}
				setConfirmDelete(false);
				await save(snap.profiles.filter((p) => p.name !== draft.name));
				setDraft(null);
				setSelected("");
			};
			const patch = (field, value) => {
				if (draft === null) return;
				setDraft({
					...draft,
					[field]: value
				});
			};
			if (snap === null) return (0, react_jsx_runtime.jsx)("div", {
				className: SubagentPoolPage_module_css_default.wrap,
				children: error !== null ? (0, react_jsx_runtime.jsx)("div", {
					className: SubagentPoolPage_module_css_default.error,
					children: error
				}) : (0, react_jsx_runtime.jsx)("div", {
					className: SubagentPoolPage_module_css_default.empty,
					children: "加载子代理配置…"
				})
			});
			return (0, react_jsx_runtime.jsxs)("div", {
				className: SubagentPoolPage_module_css_default.wrap,
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: SubagentPoolPage_module_css_default.pickerRow,
					children: [
						(0, react_jsx_runtime.jsx)(Selector, {
							value: selected,
							options: snap.profiles.map((p) => p.name),
							display: (n) => n,
							emptyLabel: "选择子代理…",
							onSelect,
							disabled: busy
						}),
						(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, {}),
							title: "添加子代理",
							onClick: onAdd,
							disabled: busy,
							children: "添加"
						}),
						(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconDownloadOutline16, {}),
							title: "保存当前子代理",
							onClick: onSave,
							disabled: draft === null || busy || draft.name.trim() === "",
							children: "保存"
						}),
						(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
							title: confirmDelete ? "再次点击确认删除" : "删除当前子代理",
							onClick: onDelete,
							disabled: draft === null || busy,
							className: confirmDelete ? SubagentPoolPage_module_css_default.danger : void 0,
							children: confirmDelete ? "确认?" : ""
						})
					]
				}), draft === null ? (0, react_jsx_runtime.jsx)("div", {
					className: SubagentPoolPage_module_css_default.empty,
					children: snap.profiles.length === 0 ? "还没有子代理。点击「添加」创建一个：给它起名、写清何时使用、选模型/推理等级/预设，之后用 subagent_run(name=\"名字\", task=\"……\") 调用。" : "选择一个子代理进行编辑，或点击「添加」创建新子代理。"
				}) : (0, react_jsx_runtime.jsxs)("div", {
					className: SubagentPoolPage_module_css_default.form,
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: SubagentPoolPage_module_css_default.row,
							children: [(0, react_jsx_runtime.jsx)("div", {
								className: SubagentPoolPage_module_css_default.rowText,
								children: (0, react_jsx_runtime.jsx)("div", {
									className: SubagentPoolPage_module_css_default.title,
									children: "名称"
								})
							}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
								className: SubagentPoolPage_module_css_default.nameInput,
								value: draft.name,
								placeholder: "子代理名（唯一）",
								disabled: busy,
								onChange: (e) => patch("name", e.target.value)
							})]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: SubagentPoolPage_module_css_default.row,
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: SubagentPoolPage_module_css_default.rowText,
								children: [(0, react_jsx_runtime.jsx)("div", {
									className: SubagentPoolPage_module_css_default.title,
									children: "描述"
								}), (0, react_jsx_runtime.jsx)("div", {
									className: SubagentPoolPage_module_css_default.desc,
									children: "发给主代理：什么时候才调用这个子代理"
								})]
							}), (0, react_jsx_runtime.jsx)("textarea", {
								className: SubagentPoolPage_module_css_default.textarea,
								value: draft.description,
								placeholder: "例：扮演女主角林晚时使用；需要剧情推进方案时使用……",
								disabled: busy,
								onChange: (e) => patch("description", e.target.value)
							})]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: SubagentPoolPage_module_css_default.row,
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: SubagentPoolPage_module_css_default.rowText,
								children: [(0, react_jsx_runtime.jsx)("div", {
									className: SubagentPoolPage_module_css_default.title,
									children: "模型"
								}), (0, react_jsx_runtime.jsx)("div", {
									className: SubagentPoolPage_module_css_default.desc,
									children: "子代理使用的模型，默认跟随主代理"
								})]
							}), (0, react_jsx_runtime.jsx)(Selector, {
								value: draft.model,
								options: snap.models,
								display: (m) => m,
								emptyLabel: "默认（主代理的模型）",
								onSelect: (id) => patch("model", id),
								disabled: busy
							})]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: SubagentPoolPage_module_css_default.row,
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: SubagentPoolPage_module_css_default.rowText,
								children: [(0, react_jsx_runtime.jsx)("div", {
									className: SubagentPoolPage_module_css_default.title,
									children: "推理等级"
								}), (0, react_jsx_runtime.jsx)("div", {
									className: SubagentPoolPage_module_css_default.desc,
									children: "off / high / max，默认跟随模型"
								})]
							}), (0, react_jsx_runtime.jsx)(Selector, {
								value: draft.reasoningEffort,
								options: snap.efforts.filter((e) => e !== ""),
								display: (e) => e,
								emptyLabel: "默认",
								onSelect: (id) => patch("reasoningEffort", id),
								disabled: busy
							})]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: SubagentPoolPage_module_css_default.row,
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: SubagentPoolPage_module_css_default.rowText,
								children: [(0, react_jsx_runtime.jsx)("div", {
									className: SubagentPoolPage_module_css_default.title,
									children: "预设"
								}), (0, react_jsx_runtime.jsx)("div", {
									className: SubagentPoolPage_module_css_default.desc,
									children: "子代理挂载的 agent 预设，默认继承主代理"
								})]
							}), (0, react_jsx_runtime.jsx)(Selector, {
								value: draft.preset,
								options: snap.presets,
								display: (p) => p,
								emptyLabel: "继承（主代理的预设）",
								onSelect: (id) => patch("preset", id),
								disabled: busy
							})]
						}),
						(0, react_jsx_runtime.jsx)("div", {
							className: SubagentPoolPage_module_css_default.hint,
							children: "保存后，主代理的系统提示里会出现这份子代理目录；调用 subagent_run(name=\"名字\", task=\"……\") 即按配置运行（模型/推理等级/预设自动套用）。"
						})
					]
				})]
			});
		}
		//#endregion
		//#region lib/client/index.js
		/** Browser plugin for dsh-subagent-pool: the 「子代理」 settings page. */
		/** Required services: slots (settings section registration). */
		const inject = ["slots"];
		function apply(ctx) {
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "subagent-pool",
				order: 51,
				label: () => "子代理"
			}, SubagentPoolPage));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map