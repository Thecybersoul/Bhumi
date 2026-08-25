import Icon from '@/components/site/Icon'
import MediaLibrary from '@/components/admin/MediaLibrary'
import { checkHealth } from '@/lib/cms'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Media · Admin' }

export default async function MediaPage() {
  const health = await checkHealth()
  const canUpload = health.state === 'empty' || health.state === 'live'

  return (
    <>
      <div className="adminHead">
        <div>
          <h1>Media</h1>
          <p>
            Every image, video and document available to the content editor. Uploads go to the
            project&rsquo;s own storage and are served from it directly.
          </p>
        </div>
      </div>

      {!canUpload && (
        <div className="adminNote">
          <Icon name="flag" size={15} />
          <span>
            <strong>{health.headline}.</strong> {health.detail}
            {health.action && <> {health.action}</>}
          </span>
        </div>
      )}

      {canUpload && !health.bucketReady && (
        <div className="adminNote">
          <Icon name="flag" size={15} />
          <span>
            The storage bucket does not exist yet. It is created automatically on the first upload —
            no setup needed in the Supabase dashboard.
          </span>
        </div>
      )}

      <MediaLibrary canUpload={canUpload} />
    </>
  )
}
