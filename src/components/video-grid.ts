/**
 * 视频卡片栅格的唯一定义（首页横排之外的「多行网格」都从这里取）。
 *
 * 消费方：SearchPageClient / douban / duanju / source-search /
 * FavoritesPanel / PlayRecordsPanel —— 之前这段 class 串在 6 个文件里各抄了一份，
 * 结果豆瓣那份漂移成了 `gap-y-12` + `minmax(160px,1fr)`，卡片比别处小一圈。
 *
 * 间距取值说明（横向紧、纵向略大，因为标题在卡片下方占一行 ~28px）：
 * - 移动端 3 列：gap-x-2（8px）/ gap-y-6（24px）
 * - 桌面端 auto-fill：gap-x-8（32px）/ gap-y-10（40px）
 * 早先纵向是 gap-y-14（56px）/ sm:gap-y-20（80px），横向只有 8px / 32px，
 * 行列间距差到 7:1 / 2.5:1，行与行之间留出一条空白带，看着「一块一块断开」。
 *
 * 注意：必须是字面量字符串，不要用模板串拼 minmax —— Tailwind 只做静态扫描。
 */
export const videoGridClass =
  'justify-start grid grid-cols-3 gap-x-2 gap-y-6 px-0 sm:grid-cols-[repeat(auto-fill,_minmax(11rem,_1fr))] sm:gap-x-8 sm:gap-y-10 sm:px-2';
