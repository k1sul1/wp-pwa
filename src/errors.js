import ExtendableError from 'es6-error'

export class SearchError extends ExtendableError {
  name = 'SearchError'
}

export class MenuLoadError extends ExtendableError {
  name = 'MenuLoadError'
}


export class ArchiveLoadError extends ExtendableError {
  name = 'ArchiveLoadError'
}

export class LookupError extends ExtendableError {
  name = 'LookupError'
}

export class Error404 extends ExtendableError {
  name = 'Error404'
}

export class Forbidden extends ExtendableError {
  name = 'Forbidden'
}

export class ResolverError extends ExtendableError {
  name = 'ResolverError'
  // FAILED_TO_LOAD_ARCHIVE = 'Unable to load archive page data, which is required for the routing to work'
}
