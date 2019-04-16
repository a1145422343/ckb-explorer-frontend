export interface Response<T> {
  type: string
  data: T
  status: number
  message: string
  pagination?: Pagination
  error?: Errors
  // particular flieds for cell and script
  cell_type?: string
  data_type?: string
}

export interface Error {
  id: string
  code: string
  status: number
  title: string
  detail: string
  href: string
}

export interface Errors {
  message: string
  errors: Error[]
}

export interface Pagination {
  previous: number
  next: number
  current: number
  page_size: number
  total: number
  pages: number
}