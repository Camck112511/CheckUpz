import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as draftFromPreset, n as PRESETS, o as emptyQuery, s as endpointIssue, t as FIELD_LABELS, v as safeHttpUrl, y as suggestMapping } from "./model-DbkB9fhJ.mjs";
import { n as ArrowRight, r as ArrowLeft } from "../_libs/lucide-react.mjs";
import { a as searchPeople, i as saveConnection, n as Route, o as testConnection, r as disconnect } from "./router-DXQV-j_u.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Ccjuiz9p.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex h-11 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium transition-opacity duration-150 disabled:pointer-events-none disabled:opacity-40", {
	variants: { variant: {
		primary: "bg-fg text-bg hover:opacity-90",
		secondary: "border border-line-strong bg-surface text-fg hover:bg-raised",
		ghost: "bg-transparent text-muted hover:text-fg",
		danger: "border border-line text-danger hover:bg-raised"
	} },
	defaultVariants: { variant: "primary" }
});
function Button({ className, variant, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn(buttonVariants({ variant }), className),
		...props
	});
}
var field = "w-full rounded-sm border border-line bg-bg px-3 text-base text-fg placeholder:text-faint disabled:opacity-50";
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn(field, "h-11", className),
		...props
	});
}
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn(field, "min-h-32 py-3", className),
		...props
	});
}
function Select({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		className: cn(field, "h-11", className),
		...props
	});
}
var STEPS = [
	{
		title: "Purpose",
		kicker: "What this desk is for"
	},
	{
		title: "Provider",
		kicker: "Account you already have"
	},
	{
		title: "Key",
		kicker: "Paste it from your account"
	},
	{
		title: "Request",
		kicker: "Authorized endpoint"
	},
	{
		title: "Response",
		kicker: "Fields to keep"
	},
	{
		title: "Test",
		kicker: "Prove the key"
	}
];
var SOURCE_LABELS = {
	name: "Full name",
	first: "First name",
	last: "Last name",
	email: "Email",
	phone: "Phone",
	location: "Location",
	company: "Company",
	domain: "Company domain",
	profile: "Profile URL",
	literal: "Fixed value"
};
var SEND_AS = [
	{
		id: "header",
		label: "Header named X-Api-Key"
	},
	{
		id: "bearer",
		label: "Authorization: Bearer"
	},
	{
		id: "query",
		label: "Query parameter named api_key"
	},
	{
		id: "json",
		label: "JSON field named api_key"
	},
	{
		id: "other",
		label: "A different name"
	}
];
var KNOWN_KEY = {
	pdl: "People Data Labs reads this as the X-Api-Key header. Paste the key from your PDL dashboard. You don't set a header name here.",
	apollo: "Apollo reads this as the x-api-key header. Paste the key from your Apollo account. You don't set a header name here.",
	hunter: "Hunter reads this as the api_key parameter. Paste the key from your Hunter account. You don't set a parameter name here."
};
function sendAsId(draft) {
	if (draft.authStyle === "bearer") return "bearer";
	if (draft.authStyle === "header" && draft.authName === "X-Api-Key") return "header";
	if (draft.authStyle === "query" && draft.authName === "api_key") return "query";
	if (draft.authStyle === "json" && draft.authName === "api_key") return "json";
	return "other";
}
function errorText$2(error) {
	if (error instanceof Error && error.message) return error.message;
	return "Something went wrong. Try again.";
}
function Wizard({ connection, onSealed, onCancel }) {
	const router = useRouter();
	const sealed = connection.connected;
	const [step, setStep] = (0, import_react.useState)(sealed ? 3 : 0);
	const [draft, setDraft] = (0, import_react.useState)(() => sealed ? {
		...connectionToDraft(connection),
		acknowledged: true
	} : draftFromPreset(PRESETS[0]));
	const [query, setQuery] = (0, import_react.useState)(emptyQuery);
	const [sample, setSample] = (0, import_react.useState)("");
	const [sampleNote, setSampleNote] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [probe, setProbe] = (0, import_react.useState)(null);
	const [revealKey, setRevealKey] = (0, import_react.useState)(false);
	const [sendAs, setSendAs] = (0, import_react.useState)(null);
	function patch(partial) {
		setDraft((current) => ({
			...current,
			...partial
		}));
		setProbe(null);
	}
	function choosePreset(id) {
		const preset = PRESETS.find((item) => item.id === id) ?? PRESETS[0];
		setDraft((current) => draftFromPreset(preset, current));
		setSendAs(null);
		setProbe(null);
		setError("");
	}
	function applySendAs(id) {
		setSendAs(id);
		setDraft((current) => {
			if (id === "header") return {
				...current,
				authStyle: "header",
				authName: "X-Api-Key"
			};
			if (id === "bearer") return {
				...current,
				authStyle: "bearer",
				authName: "Authorization"
			};
			if (id === "query") return {
				...current,
				authStyle: "query",
				authName: "api_key"
			};
			if (id === "json") return {
				...current,
				authStyle: "json",
				authName: "api_key",
				method: "POST",
				transport: "json"
			};
			const alreadyCustom = sendAsId(current) === "other";
			return {
				...current,
				authStyle: current.authStyle === "bearer" || current.authStyle === "json" ? "header" : current.authStyle,
				authName: alreadyCustom ? current.authName : ""
			};
		});
		setProbe(null);
	}
	function setOtherWhere(style) {
		setDraft((current) => {
			const next = {
				...current,
				authStyle: style
			};
			if (style === "json") {
				next.method = "POST";
				next.transport = "json";
			}
			return next;
		});
		setProbe(null);
	}
	function setMethod(method) {
		setDraft((current) => {
			const next = {
				...current,
				method
			};
			if (method === "GET") {
				next.transport = "query";
				if (current.authStyle === "json") {
					next.authStyle = "header";
					next.authName = "X-Api-Key";
				}
			}
			return next;
		});
		setProbe(null);
	}
	function tryNext() {
		const issue = issueForStep(step, draft, sealed);
		if (issue) {
			setError(issue);
			return;
		}
		setError("");
		setStep((current) => Math.min(5, current + 1));
	}
	async function runTest() {
		const issue = issueForStep(5, draft, sealed);
		if (issue) {
			setError(issue);
			return;
		}
		setBusy("test");
		setError("");
		try {
			const result = await testConnection({ data: {
				draft,
				query
			} });
			setProbe(result);
		} catch (err) {
			setProbe(null);
			setError(errorText$2(err));
		} finally {
			setBusy(null);
		}
	}
	async function seal() {
		if (probe?.authRejected) return;
		const issue = issueForStep(5, draft, sealed);
		if (issue) {
			setError(issue);
			return;
		}
		setBusy("save");
		setError("");
		try {
			await saveConnection({ data: draft });
			await router.invalidate();
			onSealed();
		} catch (err) {
			setError(errorText$2(err));
		} finally {
			setBusy(null);
		}
	}
	function applySample() {
		try {
			const parsed = JSON.parse(sample);
			const suggested = suggestMapping(parsed);
			setDraft((current) => ({
				...current,
				resultPath: suggested.resultPath || current.resultPath,
				fields: {
					...current.fields,
					...compactFields(suggested.fields)
				}
			}));
			setSampleNote(suggested.resultPath ? `Result path set to “${suggested.resultPath}”.` : "Filled paths from the top-level object.");
			setError("");
		} catch {
			setSampleNote("");
			setError("That sample is not valid JSON. Paste a redacted response from your docs.");
		}
	}
	const stepMeta = STEPS[step];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]",
		onSubmit: (event) => {
			event.preventDefault();
			if (step < 5) tryNext();
			else runTest();
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible",
			children: STEPS.map((item, index) => {
				const active = index === step;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							if (index <= step) {
								setError("");
								setStep(index);
							}
						},
						className: `flex h-11 min-w-28 items-center gap-3 rounded-md px-3 text-left lg:w-full ${active ? "bg-raised text-fg" : "text-muted"}`,
						"aria-current": active ? "step" : void 0,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-xs",
							children: String(index + 1).padStart(2, "0")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-medium",
							children: item.title
						})]
					})
				}, item.title);
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: stepMeta.kicker
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 font-display text-3xl leading-tight font-medium tracking-tight",
					children: stepMeta.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: renderStep()
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-danger",
					role: "alert",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap items-center gap-3",
					children: [
						step > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ghost",
							onClick: () => {
								setError("");
								setStep((current) => current - 1);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
								className: "size-4",
								"aria-hidden": "true"
							}), "Back"]
						}) : null,
						step < 5 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "submit",
							children: ["Continue", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
								className: "size-4",
								"aria-hidden": "true"
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: busy !== null,
							children: busy === "test" ? "Testing…" : "Test with my key"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							disabled: busy !== null || probe?.authRejected === true,
							onClick: () => void seal(),
							children: busy === "save" ? "Saving…" : "Save key and open desk"
						})] }),
						onCancel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							onClick: onCancel,
							children: "Back to desk"
						}) : null
					]
				})
			]
		})]
	});
	function renderStep() {
		if (step === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-xl text-base leading-relaxed text-muted",
				children: "You already have a provider account and an API key. This desk does not sell data and does not search the open web. It calls only the HTTPS API you authorize, for other lawful people-search use."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-start gap-3 rounded-md border border-line bg-bg p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					className: "mt-1 size-4",
					checked: draft.acknowledged,
					onChange: (event) => patch({ acknowledged: event.target.checked })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm leading-relaxed text-fg",
					children: "I will use this only for lawful lookups. I will not use it for credit, employment, housing, insurance, or any other purpose that needs a permissible purpose under the FCRA unless my provider contract allows it."
				})]
			})]
		});
		if (step === 1) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-xl text-base leading-relaxed text-muted",
					children: "The provider site can stay unknown. Pick a documented account if it matches the key you already have, or stay on the custom request and paste the endpoint from your docs."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-3",
					children: PRESETS.map((preset) => {
						const selected = draft.providerId === preset.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => choosePreset(preset.id),
							className: `rounded-md border p-4 text-left ${selected ? "border-line-strong bg-raised" : "border-line bg-bg"}`,
							"aria-pressed": selected,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-fg",
									children: preset.label
								}), selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted",
									children: "Selected"
								}) : null]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-2 block text-sm leading-relaxed text-muted",
								children: preset.summary
							})]
						}, preset.id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Docs or dashboard link",
					hint: "Optional. Stored so you can reopen it. This app never fetches that page.",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.docsUrl,
						placeholder: "https://",
						inputMode: "url",
						onChange: (event) => patch({
							docsUrl: event.target.value,
							providerId: draft.providerId
						})
					})
				})
			]
		});
		if (step === 2) {
			const known = KNOWN_KEY[draft.providerId];
			const mode = sendAs ?? sendAsId(draft);
			const savedHint = connection.connected ? connection.keyHint : "";
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-xl text-base leading-relaxed text-muted",
						children: known ?? "Paste the key from the account that issued it. Leave the menu on “Header named X-Api-Key” unless the docs name something else."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "API key",
						hint: sealed ? `A key is already saved (${savedHint}). Leave this blank to keep it, or paste a new one to replace it.` : "This box is only for the secret. Don't type a header name here.",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "min-w-0 flex-1",
								type: revealKey ? "text" : "password",
								autoComplete: "off",
								autoCapitalize: "off",
								autoCorrect: "off",
								spellCheck: false,
								value: draft.key,
								placeholder: sealed ? "Leave blank to keep the saved key" : "Paste your key",
								onChange: (event) => patch({ key: event.target.value })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								className: "shrink-0",
								"aria-pressed": revealKey,
								onClick: () => setRevealKey((value) => !value),
								children: revealKey ? "Hide" : "Show"
							})]
						})
					}),
					known ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "How should the key be sent?",
						hint: "Listed providers skip this. Custom APIs default to an X-Api-Key header.",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
							value: mode,
							onChange: (event) => applySendAs(event.target.value),
							children: SEND_AS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: option.id,
								children: option.label
							}, option.id))
						})
					}),
					!known && mode === "other" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Where",
							hint: "The place named in the docs, not the key.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: draft.authStyle === "query" || draft.authStyle === "json" ? draft.authStyle : "header",
								onChange: (event) => setOtherWhere(event.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "header",
										children: "A request header"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "query",
										children: "A query parameter"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "json",
										children: "A JSON field"
									})
								]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Name from the docs",
							hint: "Example: X-Api-Key. Do not paste the key here.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: draft.authName,
								placeholder: "X-Api-Key",
								autoComplete: "off",
								onChange: (event) => patch({ authName: event.target.value })
							})
						})]
					}) : null
				]
			});
		}
		if (step === 3) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-xl text-base leading-relaxed text-muted",
					children: "Use the API reference that belongs to your key, not a marketing homepage. The studio will refuse local, private, and non-HTTPS addresses."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "HTTPS endpoint",
					hint: "No query string. Example: https://api.example.com/v1/people",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.endpoint,
						inputMode: "url",
						placeholder: "https://",
						onChange: (event) => patch({ endpoint: event.target.value })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Method",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: draft.method,
							onChange: (event) => setMethod(event.target.value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "GET",
								children: "GET"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "POST",
								children: "POST"
							})]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Parameters travel in",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: draft.transport,
							disabled: draft.method === "GET" || draft.authStyle === "json",
							onChange: (event) => patch({ transport: event.target.value }),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "query",
								children: "Query string"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "json",
								children: "JSON body"
							})]
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-medium text-fg",
							children: "Field mapping"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							onClick: () => patch({ params: [...draft.params, {
								name: "",
								source: "name",
								as: "string",
								literal: ""
							}] }),
							children: "Add parameter"
						})]
					}), draft.params.map((param, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-2 rounded-md border border-line bg-bg p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								"aria-label": "Parameter name",
								placeholder: "parameter",
								value: param.name,
								onChange: (event) => updateParam(index, { name: event.target.value })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
								"aria-label": "Value source",
								value: param.source,
								onChange: (event) => updateParam(index, { source: event.target.value }),
								children: Object.entries(SOURCE_LABELS).map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: id,
									children: label
								}, id))
							}),
							param.source === "literal" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								"aria-label": "Fixed value",
								placeholder: "Fixed value",
								value: param.literal,
								onChange: (event) => updateParam(index, { literal: event.target.value })
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								"aria-label": "Value shape",
								value: param.as,
								onChange: (event) => updateParam(index, { as: event.target.value }),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "string",
									children: "String"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "array",
									children: "Single-item array"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								className: "sm:col-span-3 sm:justify-self-start",
								onClick: () => patch({ params: draft.params.filter((_, item) => item !== index) }),
								children: "Remove"
							})
						]
					}, `${param.name}-${index}`))]
				})
			]
		});
		if (step === 4) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-xl text-base leading-relaxed text-muted",
					children: "Tell the desk which JSON paths are a person. Leave a path blank and common names such as full_name or email are used. Paste a redacted sample if you want paths suggested. Do not paste a real person’s record."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Result path",
					hint: "Where the person or list lives. Examples: data, people, results. Blank uses common keys.",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.resultPath,
						placeholder: "data",
						onChange: (event) => patch({ resultPath: event.target.value })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: FIELD_LABELS.map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: field.label,
						hint: `Example: ${field.hint}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: draft.fields[field.key],
							placeholder: field.hint,
							onChange: (event) => patch({ fields: {
								...draft.fields,
								[field.key]: event.target.value
							} })
						})
					}, field.key))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Redacted sample JSON",
					hint: "Optional. Used only in this browser to suggest paths. It is not saved.",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						value: sample,
						placeholder: "{\"data\":{\"full_name\":\"Example Person\",\"emails\":[\"person@example.com\"]}}",
						onChange: (event) => setSample(event.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: applySample,
						disabled: !sample.trim(),
						children: "Suggest paths"
					}), sampleNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: sampleNote
					}) : null]
				})
			]
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-xl text-base leading-relaxed text-muted",
					children: "Run one lookup through your account. A 404 with a valid key still counts as connected. An auth rejection blocks sealing until the key or auth style changes."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LookupFields, {
					query,
					onChange: setQuery
				}),
				probe ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-md border border-line bg-bg p-4",
					"aria-live": "polite",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-fg",
							children: [
								"HTTP ",
								probe.httpStatus,
								". ",
								probe.message
							]
						}),
						probe.results.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 grid gap-2",
							children: probe.results.slice(0, 3).map((person, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "text-sm text-muted",
								children: [person.name || "Unnamed record", person.company ? ` · ${person.company}` : ""]
							}, `${person.id}-${index}`))
						}) : null,
						probe.paths.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm leading-relaxed break-all text-faint",
							children: probe.paths.slice(0, 12).join(" · ")
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							className: "mt-3",
							onClick: () => patch({
								resultPath: probe.suggested.resultPath || draft.resultPath,
								fields: {
									...draft.fields,
									...compactFields(probe.suggested.fields)
								}
							}),
							children: "Apply suggested paths"
						})
					]
				}) : null
			]
		});
	}
	function updateParam(index, partial) {
		patch({ params: draft.params.map((param, item) => item === index ? {
			...param,
			...partial
		} : param) });
	}
}
function connectionToDraft(connection) {
	if (!connection.connected) return draftFromPreset(PRESETS[0]);
	return {
		providerId: connection.providerId,
		endpoint: connection.endpoint,
		method: connection.method,
		transport: connection.transport,
		authStyle: connection.authStyle,
		authName: connection.authName,
		key: "",
		docsUrl: connection.docsUrl,
		params: connection.params.map((param) => ({ ...param })),
		resultPath: connection.resultPath,
		fields: { ...connection.fields },
		acknowledged: true
	};
}
function issueForStep(step, draft, sealed) {
	if (step === 0 && !draft.acknowledged) return "Confirm the lawful-use acknowledgement to continue.";
	if (step === 1 && draft.docsUrl.trim()) {
		if (endpointIssue(draft.docsUrl.trim())) return "The docs link must be a public HTTPS URL, or leave it blank.";
	}
	if (step >= 2 && !sealed && draft.key.trim().length < 8) return "Paste the API key from your provider account.";
	if (step >= 2 && draft.key.trim() && draft.key.trim().length < 8) return "That key looks too short. Paste the full key.";
	if (step >= 2 && draft.authStyle !== "bearer" && !/^[A-Za-z0-9-]{1,40}$/.test(draft.authName.trim())) return "Enter the header, query, or JSON field name from your provider docs.";
	if (step >= 3) {
		const endpoint = endpointIssue(draft.endpoint.trim());
		if (endpoint) return endpoint;
		if (!draft.params.some((param) => param.name.trim() && param.source !== "literal")) return "Map at least one search field to a parameter name.";
	}
	return "";
}
function compactFields(fields) {
	const next = {};
	for (const key of Object.keys(fields)) if (fields[key]) next[key] = fields[key];
	return next;
}
function LookupFields({ query, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 sm:grid-cols-2",
		children: [[
			{
				key: "name",
				label: "Full name",
				placeholder: "First Last"
			},
			{
				key: "location",
				label: "Location",
				placeholder: "City, region"
			},
			{
				key: "email",
				label: "Email",
				placeholder: "name@company.com"
			},
			{
				key: "phone",
				label: "Phone",
				placeholder: "+1…"
			},
			{
				key: "company",
				label: "Company",
				placeholder: "Company name"
			},
			{
				key: "domain",
				label: "Company domain",
				placeholder: "company.com"
			}
		].map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
			label: field.label,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: query[field.key],
				placeholder: field.placeholder,
				autoComplete: "off",
				onChange: (event) => onChange({
					...query,
					[field.key]: event.target.value
				})
			})
		}, field.key)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "sm:col-span-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Profile URL",
				hint: "Sent only as a parameter to your provider. This app does not open it.",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: query.profile,
					placeholder: "https://www.linkedin.com/in/…",
					inputMode: "url",
					autoComplete: "off",
					onChange: (event) => onChange({
						...query,
						profile: event.target.value
					})
				})
			})
		})]
	});
}
function Field({ label, hint, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mb-2 block text-sm font-medium text-fg",
				children: label
			}),
			children,
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-2 block text-sm leading-relaxed text-muted",
				children: hint
			}) : null
		]
	});
}
function errorText$1(error) {
	if (error instanceof Error && error.message) return error.message;
	return "The lookup did not finish. Try again.";
}
function Desk({ connection }) {
	const router = useRouter();
	const [query, setQuery] = (0, import_react.useState)(emptyQuery);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [message, setMessage] = (0, import_react.useState)("");
	const [results, setResults] = (0, import_react.useState)(null);
	const [remaining, setRemaining] = (0, import_react.useState)(connection.searchesRemaining);
	async function onSearch() {
		setBusy(true);
		setError("");
		try {
			const response = await searchPeople({ data: query });
			setResults(response.results);
			setMessage(response.message);
			setRemaining(response.searchesRemaining);
			await router.invalidate();
		} catch (err) {
			setError(errorText$1(err));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid items-start gap-6 lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "rounded-xl border border-line bg-surface p-4 sm:p-6",
			onSubmit: (event) => {
				event.preventDefault();
				onSearch();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-3xl leading-tight font-medium tracking-tight",
					children: "Lookup"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted",
					children: [
						"One person at a time, through ",
						connection.label,
						". The key ",
						connection.keyHint,
						" stays on the server."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LookupFields, {
						query,
						onChange: setQuery
					})
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-danger",
					role: "alert",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex flex-wrap items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: busy || remaining <= 0,
						children: busy ? "Looking up…" : "Run lookup"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [remaining, " lookups left this hour"]
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "min-w-0",
			"aria-live": "polite",
			children: results === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SampleDossier, {}) : results.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-line bg-surface p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-medium tracking-tight",
					children: "No mapped record"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted",
					children: message || "The provider returned nothing this desk could map."
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3",
				children: [message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: message
				}) : null, results.map((person, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecordCard, {
					person,
					host: connection.host
				}, `${person.id}-${index}`))]
			})
		})]
	});
}
function SampleDossier() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-xl border border-line bg-surface p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium tracking-wide text-muted",
				children: "Sample record"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-3 font-display text-3xl leading-tight font-medium tracking-tight",
				children: "Avery Quinn"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Records clerk · Northwind Archive"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-5 grid gap-3 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
					className: "text-muted",
					children: "Location"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
					className: "text-fg",
					children: "Sample City"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
					className: "text-muted",
					children: "Email"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
					className: "text-fg",
					children: "avery.quinn@example.com"
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 text-sm leading-relaxed text-muted",
				children: "Not a live person. A real lookup replaces this card with fields your provider returns."
			})
		]
	});
}
function RecordCard({ person, host }) {
	const profile = safeHttpUrl(person.linkedin);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-xl border border-line bg-surface p-4 sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display text-2xl leading-tight font-medium tracking-tight",
					children: person.name || "Unnamed record"
				}), person.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: person.note
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: [person.title, person.company].filter(Boolean).join(" · ") || "No title returned"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-5 grid gap-4 text-sm sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
						label: "Location",
						value: person.location || "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
						label: "Record id",
						value: person.id || "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
						label: "Emails",
						value: person.emails.length ? person.emails.join(", ") : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
						label: "Phones",
						value: person.phones.length ? person.phones.join(", ") : "—"
					})
				]
			}),
			profile ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				className: "mt-4 inline-flex h-11 items-center text-sm text-fg underline decoration-line underline-offset-4",
				href: profile,
				target: "_blank",
				rel: "noreferrer",
				children: "Open profile link"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-xs text-faint",
				children: ["Returned by ", host]
			})
		]
	});
}
function Fact({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "break-words text-fg",
			children: value
		})]
	});
}
function errorText(error) {
	if (error instanceof Error && error.message) return error.message;
	return "Could not update the sealed key.";
}
function Studio({ connection }) {
	const router = useRouter();
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [confirmWipe, setConfirmWipe] = (0, import_react.useState)(false);
	const [wipeError, setWipeError] = (0, import_react.useState)("");
	const [wiping, setWiping] = (0, import_react.useState)(false);
	const showDesk = connection.connected && !editing;
	async function wipe() {
		setWiping(true);
		setWipeError("");
		try {
			await disconnect();
			setConfirmWipe(false);
			setEditing(false);
			await router.invalidate();
		} catch (error) {
			setWipeError(errorText(error));
		} finally {
			setWiping(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-6xl px-4 pt-6 pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-11 place-items-center rounded-sm border border-line bg-surface font-display text-sm text-fg",
						children: "PS"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Lawful lookup"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-2xl leading-tight font-medium tracking-tight sm:text-3xl",
						children: "PeopleSearch Studio"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "rounded-sm border border-line bg-surface px-3 py-2 text-sm text-muted",
							children: connection.connected ? `Sealed · ${connection.label} · ${connection.host}` : "Provider site not set"
						}),
						connection.connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-11 rounded-sm border border-line-strong bg-surface px-4 text-sm font-medium text-fg",
							onClick: () => {
								setConfirmWipe(false);
								setEditing((value) => !value);
							},
							children: editing ? "Close setup" : "Integration"
						}) : null,
						connection.connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-11 rounded-sm px-3 text-sm text-muted",
							onClick: () => {
								setWipeError("");
								setConfirmWipe((value) => !value);
							},
							children: "Disconnect"
						}) : null
					]
				})]
			}),
			confirmWipe ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap items-center gap-3 rounded-md border border-line bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-fg",
						children: "Wipe the sealed key from this browser?"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-11 rounded-sm bg-fg px-4 text-sm font-medium text-bg disabled:opacity-40",
						disabled: wiping,
						onClick: () => void wipe(),
						children: wiping ? "Wiping…" : "Wipe key"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-11 px-3 text-sm text-muted",
						onClick: () => setConfirmWipe(false),
						children: "Cancel"
					}),
					wipeError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-danger",
						children: wipeError
					}) : null
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8",
				children: showDesk && connection.connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, { connection }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wizard, {
						connection,
						onSealed: () => setEditing(false),
						onCancel: connection.connected ? () => setEditing(false) : void 0
					}, connection.connected ? connection.host : "new"), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hidden xl:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SampleDossier, {})
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "mt-10 max-w-3xl text-sm leading-relaxed text-muted",
				children: "PeopleSearch Studio calls only the API you authorize with your own key. It is not a consumer reporting agency and it does not search the open web. Do not use it for credit, employment, housing, insurance, or any purpose that needs a permissible purpose under the FCRA unless your provider contract says you may. A sealed key stays in an encrypted cookie on this browser for 12 hours. Disconnect wipes it."
			})
		]
	});
}
function Home() {
	const connection = Route.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Studio, { connection }) });
}
//#endregion
export { Home as component };
