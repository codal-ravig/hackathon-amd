import { defineType, defineField, defineArrayMember } from 'sanity'
import { TagIcon } from '@sanity/icons'

export const campaign = defineType({
  name: 'campaign',
  title: 'Campaign',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          validation: (rule) => rule.required().warning('Alt text is important for accessibility and SEO'),
        }),
      ],
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        defineArrayMember({ type: 'block' }),
      ],
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (rule) => rule.required().min(0),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'headline',
      media: 'heroImage',
    },
  },
})
