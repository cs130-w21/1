import http from 'http'
import tar from 'tar'

const URL = 'http://ftp.gnu.org/gnu/make/make-4.3.tar.gz'

async function getMake() {
	http.get(URL, (res) => {
		res.pipe(tar.x({ strip: 1, cwd: 'make' }))
	})
}

export async function makeMake(): Promise<void> {
	await getMake()
}
