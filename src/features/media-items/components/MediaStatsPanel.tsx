import {
  ChartBarSquareIcon,
  FilmIcon,
  SparklesIcon,
  TagIcon,
} from '@heroicons/react/24/outline'
import type { MediaItemsStatsResponse } from '@/features/media-items/schemas/mediaItemSchema'
import {
  contentKindLabels,
  mediaSourceLabels,
  mediaTrackingStatusLabels,
} from '@/features/media-items/schemas/mediaItemSchema'

interface MediaStatsPanelProps {
  stats?: MediaItemsStatsResponse
}

export default function MediaStatsPanel({ stats }: MediaStatsPanelProps) {
  const summaryCards = [
    { label: 'Total', value: stats?.totalCount ?? '—', hint: 'Obras registradas' },
    { label: 'Promedio', value: stats?.averagePersonalScore ?? '—', hint: `${stats?.scoredItemsCount ?? '—'} puntuados` },
    { label: 'Iniciados mes', value: stats?.startedThisMonthCount ?? '—', hint: 'Actividad reciente' },
    { label: 'Completados mes', value: stats?.completedThisMonthCount ?? '—', hint: 'Cierres del mes' },
    { label: 'Backlog sin empezar', value: stats?.backlogWithoutStartCount ?? '—', hint: 'Planeados sin inicio' },
  ]

  const statusBreakdown = [
    { status: 'Planned', count: stats?.plannedCount ?? '—' },
    { status: 'InProgress', count: stats?.inProgressCount ?? '—' },
    { status: 'Completed', count: stats?.completedCount ?? '—' },
    { status: 'OnHold', count: stats?.onHoldCount ?? '—' },
    { status: 'Dropped', count: stats?.droppedCount ?? '—' },
  ] as const

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2 className="panel__title">Resumen de la biblioteca</h2>
          <p className="panel__description">
            Estadísticas actualizadas de tu colección.
          </p>
        </div>
        <span className="hero-chip">
          <ChartBarSquareIcon width={18} height={18} />
          Datos vivos
        </span>
      </div>

      <div className="stats-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="stat-card">
            <p className="stat-card__label">{card.label}</p>
            <p className="stat-card__value">{card.value}</p>
            <p className="stat-card__hint">{card.hint}</p>
          </article>
        ))}
      </div>

      <div className="breakdown-grid">
        <section className="panel panel--dense">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Estados</h3>
              <p className="panel__description">Distribución del seguimiento actual.</p>
            </div>
            <ChartBarSquareIcon width={18} height={18} color="var(--accent-primary)" />
          </div>
          <ul className="breakdown-list">
            {statusBreakdown.map((item) => (
              <li key={item.status}>
                <span className="breakdown-list__label">{mediaTrackingStatusLabels[item.status]}</span>
                <span className="breakdown-list__count">{item.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel panel--dense">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Formatos base</h3>
              <p className="panel__description">Distribución del catálogo por dominio neutral.</p>
            </div>
            <FilmIcon width={18} height={18} color="var(--accent-secondary)" />
          </div>
          {stats?.contentKindBreakdown.length ? (
            <ul className="breakdown-list">
              {stats.contentKindBreakdown.map((item) => (
                <li key={item.contentKind}>
                  <span className="breakdown-list__label">{contentKindLabels[item.contentKind]}</span>
                  <span className="breakdown-list__count">{item.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel__description">Sin datos todavía.</p>
          )}
        </section>

        <section className="panel panel--dense">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Categorías activas</h3>
              <p className="panel__description">Qué taxonomías personales concentran más elementos.</p>
            </div>
            <TagIcon width={18} height={18} color="var(--accent-primary)" />
          </div>
          {stats?.categoryBreakdown.length ? (
            <ul className="breakdown-list">
              {stats.categoryBreakdown.map((item) => (
                <li key={item.categoryId}>
                  <div>
                    <div className="breakdown-list__primary">
                      <span
                        className="category-pill__swatch"
                        style={{ backgroundColor: item.color ?? 'transparent' }}
                        aria-hidden="true"
                      />
                      <span className="breakdown-list__label">{item.categoryName}</span>
                    </div>
                  </div>
                  <span className="breakdown-list__count">{item.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel__description">Todavía no hay categorías asignadas.</p>
          )}
        </section>

        <section className="panel panel--dense">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Puntuación por formato</h3>
              <p className="panel__description">Promedio personal agrupado por tipo base.</p>
            </div>
            <ChartBarSquareIcon width={18} height={18} color="var(--accent-secondary)" />
          </div>
          {stats?.averageScoreByContentKind.length ? (
            <ul className="breakdown-list">
              {stats.averageScoreByContentKind.map((item) => (
                <li key={item.contentKind}>
                  <div>
                    <span className="breakdown-list__label">{contentKindLabels[item.contentKind]}</span>
                    <span className="breakdown-list__meta">{item.scoredItemsCount} puntuados</span>
                  </div>
                  <span className="breakdown-list__count">{item.averagePersonalScore}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel__description">Aún no hay suficientes puntuaciones para calcular promedios.</p>
          )}
        </section>

        <section className="panel panel--dense">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Origen de los registros</h3>
              <p className="panel__description">Qué parte llegó manualmente y cuál viene de Jikan.</p>
            </div>
            <SparklesIcon width={18} height={18} color="var(--accent-primary)" />
          </div>
          {stats?.sourceBreakdown.length ? (
            <ul className="breakdown-list">
              {stats.sourceBreakdown.map((item) => (
                <li key={item.sourceType}>
                  <span className="breakdown-list__label">{mediaSourceLabels[item.sourceType]}</span>
                  <span className="breakdown-list__count">{item.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel__description">Sin registros todavía.</p>
          )}
        </section>
      </div>
    </section>
  )
}