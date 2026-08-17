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

import { useEffect, useState } from 'react'
import {
  Button,
  Input,
  Menu,
  IconChevronDownOutline14,
  IconDownloadOutline16,
  IconPlusOutline16,
  IconTrashOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import css from './SubagentPoolPage.module.css'

/** Same-origin settings-page endpoint served by the host half. */
const PROFILES_ROUTE = '/plugins/dsh-subagent-pool/profiles'

async function apiGet(): Promise<unknown> {
  const res = await fetch(PROFILES_ROUTE, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function apiSave(profiles: Profile[]): Promise<void> {
  const res = await fetch(PROFILES_ROUTE, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ profiles }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  await res.json()
}

/** One named subagent template (mirrors the host SubagentProfile). */
interface Profile {
  name: string
  description: string
  model: string
  reasoningEffort: string
  preset: string
}

/** Host snapshot: profiles plus picker metadata. */
interface Snapshot {
  profiles: Profile[]
  presets: string[]
  models: string[]
  efforts: string[]
}

const EMPTY_DRAFT: Profile = { name: '', description: '', model: '', reasoningEffort: '', preset: '' }

/** One pill selector: Menu + official chevron, in the Setting-Cell style. */
function Selector({
  value,
  options,
  display,
  emptyLabel,
  onSelect,
  disabled,
}: {
  value: string
  /** Option ids; `''` renders the empty/default entry. */
  options: string[]
  /** Label for a concrete option id. */
  display: (id: string) => string
  /** Label shown for the `''` (default) entry. */
  emptyLabel: string
  onSelect: (id: string) => void
  disabled?: boolean
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const items = ['', ...options.filter((o) => o !== '')].map((id) => ({
    id,
    label: id === '' ? emptyLabel : display(id),
  }))
  return (
    <Menu
      open={open}
      onClose={() => { setOpen(false) }}
      items={items}
      selectedId={value}
      onSelect={(id) => { onSelect(id); setOpen(false) }}
      align="end"
      className={css.selectorWrap}
      anchor={(
        <button
          type="button"
          className={css.selector}
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => { setOpen(v => !v) }}
        >
          <span className={css.selectorText}>{value === '' ? emptyLabel : display(value)}</span>
          <IconChevronDownOutline14 className={css.chevron} />
        </button>
      )}
    />
  )
}

export function SubagentPoolPage(): JSX.Element {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState('')
  const [draft, setDraft] = useState<Profile | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = async (): Promise<void> => {
    try {
      const s = (await apiGet()) as Snapshot
      setSnap(s)
      setError(null)
    } catch (err: unknown) {
      setSnap(null)
      setError(`无法加载子代理配置：${err instanceof Error ? err.message : String(err)}（插件 host 可能未更新，请重启 dsh 后重试）`)
    }
  }

  // Fetch the host snapshot once when the settings section first mounts.
  // Without this effect `snap` remains null and the page stays on its loader.
  useEffect(() => {
    void load()
  }, [])

  const save = async (profiles: Profile[]): Promise<void> => {
    setBusy(true)
    try {
      await apiSave(profiles)
      await load()
    } finally {
      setBusy(false)
    }
  }

  // Switching templates or adding discards unsaved edits (no cancel button).
  const onSelect = (name: string): void => {
    if (snap === null) return
    setSelected(name)
    const found = snap.profiles.find((p) => p.name === name)
    setDraft(found !== undefined ? { ...found } : null)
    setConfirmDelete(false)
  }

  const onAdd = (): void => {
    setSelected('')
    setDraft({ ...EMPTY_DRAFT })
    setConfirmDelete(false)
  }

  const onSave = async (): Promise<void> => {
    if (draft === null || snap === null) return
    const name = draft.name.trim()
    if (name === '') return
    const next = snap.profiles.some((p) => p.name === name)
      ? snap.profiles.map((p) => (p.name === name ? draft : p))
      : [...snap.profiles, draft]
    await save(next)
    setSelected(name)
    setConfirmDelete(false)
  }

  const onDelete = async (): Promise<void> => {
    if (draft === null || snap === null) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setConfirmDelete(false)
    await save(snap.profiles.filter((p) => p.name !== draft.name))
    setDraft(null)
    setSelected('')
  }

  const patch = (field: keyof Profile, value: string): void => {
    if (draft === null) return
    setDraft({ ...draft, [field]: value })
  }

  if (snap === null) {
    return (
      <div className={css.wrap}>
        {error !== null
          ? <div className={css.error}>{error}</div>
          : <div className={css.empty}>加载子代理配置…</div>}
      </div>
    )
  }

  return (
    <div className={css.wrap}>
      <div className={css.pickerRow}>
        <Selector
          value={selected}
          options={snap.profiles.map((p) => p.name)}
          display={(n) => n}
          emptyLabel="选择子代理…"
          onSelect={onSelect}
          disabled={busy}
        />
        <Button variant="ghost" size="sm" icon={<IconPlusOutline16 />} title="添加子代理" onClick={onAdd} disabled={busy}>添加</Button>
        <Button variant="ghost" size="sm" icon={<IconDownloadOutline16 />} title="保存当前子代理" onClick={onSave} disabled={draft === null || busy || draft.name.trim() === ''}>保存</Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<IconTrashOutline16 />}
          title={confirmDelete ? '再次点击确认删除' : '删除当前子代理'}
          onClick={onDelete}
          disabled={draft === null || busy}
          className={confirmDelete ? css.danger : undefined}
        >{confirmDelete ? '确认?' : ''}</Button>
      </div>

      {draft === null ? (
        <div className={css.empty}>
          {snap.profiles.length === 0
            ? '还没有子代理。点击「添加」创建一个：给它起名、写清何时使用、选模型/推理等级/预设，之后用 subagent_run(name="名字", task="……") 调用。'
            : '选择一个子代理进行编辑，或点击「添加」创建新子代理。'}
        </div>
      ) : (
        <div className={css.form}>
          <div className={css.row}>
            <div className={css.rowText}>
              <div className={css.title}>名称</div>
            </div>
            <Input
              className={css.nameInput}
              value={draft.name}
              placeholder="子代理名（唯一）"
              disabled={busy}
              onChange={(e) => patch('name', e.target.value)}
            />
          </div>
          <div className={css.row}>
            <div className={css.rowText}>
              <div className={css.title}>描述</div>
              <div className={css.desc}>发给主代理：什么时候才调用这个子代理</div>
            </div>
            <textarea
              className={css.textarea}
              value={draft.description}
              placeholder="例：扮演女主角林晚时使用；需要剧情推进方案时使用……"
              disabled={busy}
              onChange={(e) => patch('description', e.target.value)}
            />
          </div>
          <div className={css.row}>
            <div className={css.rowText}>
              <div className={css.title}>模型</div>
              <div className={css.desc}>子代理使用的模型，默认跟随主代理</div>
            </div>
            <Selector
              value={draft.model}
              options={snap.models}
              display={(m) => m}
              emptyLabel="默认（主代理的模型）"
              onSelect={(id) => patch('model', id)}
              disabled={busy}
            />
          </div>
          <div className={css.row}>
            <div className={css.rowText}>
              <div className={css.title}>推理等级</div>
              <div className={css.desc}>off / high / max，默认跟随模型</div>
            </div>
            <Selector
              value={draft.reasoningEffort}
              options={snap.efforts.filter((e) => e !== '')}
              display={(e) => e}
              emptyLabel="默认"
              onSelect={(id) => patch('reasoningEffort', id)}
              disabled={busy}
            />
          </div>
          <div className={css.row}>
            <div className={css.rowText}>
              <div className={css.title}>预设</div>
              <div className={css.desc}>子代理挂载的 agent 预设，默认继承主代理</div>
            </div>
            <Selector
              value={draft.preset}
              options={snap.presets}
              display={(p) => p}
              emptyLabel="继承（主代理的预设）"
              onSelect={(id) => patch('preset', id)}
              disabled={busy}
            />
          </div>
          <div className={css.hint}>
            保存后，主代理的系统提示里会出现这份子代理目录；调用 subagent_run(name="名字", task="……") 即按配置运行（模型/推理等级/预设自动套用）。
          </div>
        </div>
      )}
    </div>
  )
}
