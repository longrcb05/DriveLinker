/**
 * DTO phân trang tương ứng com.drivelinker.common.response.PageResponse trong Java.
 */
export class PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;

  constructor(
    content: T[],
    pageNumber: number,
    pageSize: number,
    totalElements: number
  ) {
    this.content = content;
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
    this.totalElements = totalElements;
    this.totalPages = Math.ceil(totalElements / pageSize);
    this.last = pageNumber >= this.totalPages;
  }
}

export default PageResponse;

