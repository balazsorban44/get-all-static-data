import {
  GetStaticPaths,
  GetStaticPathsResult,
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPropsResult,
} from "next"

export type GetStaticPropsContextWithData<
  D = unknown
> = GetStaticPropsContext & {
  data: D
}

export async function defaultGetStaticProps(
  ctx: GetStaticPropsContextWithData
) {
  return {
    props: ctx.data,
  }
}

export interface GetAllStaticDataParams<
  D = unknown,
  P = Record<string, unknown>
> {
  /** Returns a list of data */
  getData(): Promise<D[]>
  /**
   * Which property should be used as a key
   * (This will be returned from `getStaticPaths` as the param)
   * */
  key: keyof D
  /**
   * File name
   * @todo Check if this can be extracted
   */
  name: string
  /**
   * By default,
   * the `props` return property will equal to the data,
   * and `revalidate is set to `1`.
   * You can override this function as you like.
   * It is exactly like a `getStaticProps` function, only with `context.data`
   * set to the data returned from `getStaticPaths` with a matching path.
   * See `key`
   * */
  getStaticPropsWithData?: (
    context: GetStaticPropsContextWithData<D>
  ) => Promise<GetStaticPropsResult<P>>
  /** Fallback value for `getStaticPaths`. */
  fallback?: GetStaticPathsResult["fallback"]
}

export default function getAllStaticData<
  D = unknown,
  P = Record<string, unknown>
>({
  getData,
  key,
  name,
  getStaticPropsWithData = defaultGetStaticProps,
  fallback = false,
}: GetAllStaticDataParams<D, P>) {
  const getStaticPaths: (fs: typeof import("fs")) => GetStaticPaths = (
    fs
  ) => async (): Promise<GetStaticPathsResult> => {
    const result = await getData()
    await fs.promises.writeFile(".cache", JSON.stringify(result), "utf8")
    return {
      fallback,
      paths: result.map((element) => ({
        params: { [name]: [element[key]] },
      })),
    }
  }

  const getStaticProps: (fs: typeof import("fs")) => GetStaticProps = (
    fs
  ) => async (ctx) => {
    const result = await fs.promises.readFile(".cache", "utf8")
    const _slug = ctx.params?.[name as any] as string[]
    const slug = _slug.flat().join("/") as any
    const parsedResult = JSON.parse(result) as D[]

    const data = parsedResult.find((element) => element[key] === slug) as D
    console.log(slug, data)
    return getStaticPropsWithData({ ...ctx, data })
  }

  return { getStaticPaths, getStaticProps }
}
