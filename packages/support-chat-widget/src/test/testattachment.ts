import { Message } from '../api/client';

export const attachments: Message[] = [
  {
    message_id: 'init',
    conversation_id: '112',
    seq_no: -1,
    sender: 'support',
    attachments: [
      {
        attachment_id: '1',
        file_name: 'image1.png',
        content_type: 'image/jpg',
        download_url: 'https://i.pinimg.com/736x/e7/52/41/e752414f11f1b9d7245416319bef2bed.jpg',
        size_bytes: 102400,
      },
      {
        attachment_id: '2',
        file_name: 'image1.png',
        content_type: 'image/jpg',
        download_url: 'https://i.pinimg.com/736x/8a/11/e5/8a11e5bfbfc630f09c7d78dc5b3bc66e.jpg',
        size_bytes: 102400,
      },
      {
        attachment_id: '3',
        file_name: 'image1.png',
        content_type: 'image/jpg',
        download_url: 'https://i.pinimg.com/736x/b9/6f/a5/b96fa5696530862edd201235eceaab79.jpg',
        size_bytes: 102400,
      },
      {
        attachment_id: '4',
        file_name: 'image1.png',
        content_type: 'image/jpg',
        download_url: 'https://i.pinimg.com/1200x/6b/13/ed/6b13eda428b1aa2fe83d97064ffcc1c4.jpg',
        size_bytes: 102400,
      },
      {
        attachment_id: '5',
        file_name: 'image1.png',
        content_type: 'image/jpg',
        download_url: 'https://i.pinimg.com/736x/a6/96/c3/a696c3aa11693ea116d0b92e6c47333b.jpg',
        size_bytes: 102400,
      },
      {
        attachment_id: '5',
        file_name: 'image1.png',
        content_type: 'image/jpg',
        download_url: 'https://i.pinimg.com/736x/f8/c8/2d/f8c82d36735489a8841b304f281faf0b.jpg',
        size_bytes: 102400,
      },
    ],
    source: 'web',
    content_type: 'text',
    created_at: new Date().toISOString(),
  },
];
