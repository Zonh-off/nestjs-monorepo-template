import { List, useTable } from "@refinedev/antd";
import { Table } from "antd";

export const UserList = () => {
    const { tableProps } = useTable({
        syncWithLocation: true,
    });

    return (
        <List>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="id" title="ID" />
                <Table.Column dataIndex="name" title="Name" />
                <Table.Column dataIndex="email" title="Email" />
                <Table.Column dataIndex="createdAt" title="Joined" render={(value) => new Date(value).toLocaleDateString()} />
            </Table>
        </List>
    );
};
