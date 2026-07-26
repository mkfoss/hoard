<svelte:head><title>Hoard</title></svelte:head>

<section class="space-y-6">
	<div class="flex flex-wrap items-center gap-3">
		<h1 class="text-4xl font-bold sm:text-5xl">Hoard</h1>
		<span class="badge badge-warning">Early development</span>
	</div>

	<p class="text-xl opacity-80">Your media. Your server. Your rules.</p>

	<div class="card bg-base-100 shadow-sm">
		<div class="card-body gap-4">
			<h2 class="card-title">This is the new Hoard interface</h2>
			<p>
				Hoard is being built alongside the interface you already use, against the same server and
				the same library. Nothing here replaces the classic interface yet.
			</p>

			<div role="status" class="alert alert-info">
				<span>
					Features arrive as complete workflows — browse, open, play, edit, save — rather than as
					half-finished screens.
				</span>
			</div>

			<div class="card-actions">
				<!--
					Deliberately not resolve()d: the classic interface is served by the Go
					server at the site root, outside this SPA's base path. resolve('/')
					would point back at /hoard.
				-->
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="btn btn-primary" href="/">Open the classic interface</a>
			</div>
		</div>
	</div>
</section>
